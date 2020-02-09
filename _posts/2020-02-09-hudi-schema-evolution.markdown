---
layout: post
title:  "Hudi Schema Evolution"
date:   2020-02-09 10:09:00 +0200
categories: hudi spark
---

## Overview
This time I will describe a way to read files, written using [Apache Hudi][apache-hudi] that were schema evolved over 
time.
The whole code that is described in the following sections could be found in a single [gist][gist], for your convenience.

## Preparation

### Starting spark-shell
The fastest and easiest way to show this example is to use `spark-shell`, make sure you have it installed and working 
with version `2.4.4` of [Apache Spark][apache-spark].

To start the `spark-shell` with Hudi's support, you can run the following command:
{% highlight shell %}
spark-shell --packages org.apache.hudi:hudi-spark-bundle_2.11:0.5.1-incubating,org.apache.spark:spark-avro_2.11:2.4.4 --conf 'spark.serializer=org.apache.spark.serializer.KryoSerializer'
{% endhighlight %}
It should download the mentioned dependencies if they don't exist.

Now just import the following libs that will help with writing the Hudi files:
{% highlight scala %}
import org.apache.hudi.QuickstartUtils._
import org.apache.hudi.DataSourceWriteOptions.{PARTITIONPATH_FIELD_OPT_KEY, PRECOMBINE_FIELD_OPT_KEY, RECORDKEY_FIELD_OPT_KEY}
import org.apache.hudi.config.HoodieWriteConfig.TABLE_NAME
import org.apache.spark.sql.SaveMode
{% endhighlight %}

### Creating the events
We will create two simple JSON format events. One of them will be older, and one newer with a one extra field, 
regarding their event time. 
{% highlight scala %}
// Base event
val event1 = "{'uuid': '1', 'utc': 1000, 'event_date': '20200205', 'driver_id': 'aaa', 'lat': 33.3, 'lng': 33.3}"
// Evolved event
val event2 = "{'uuid': '2', 'utc': 2000, 'event_date': '20200206', 'driver_id': 'aaa', 'lat': 33.3, 'lng': 33.3, 'direction': 'N'}"
{% endhighlight %}

As we can see the second event is happened later in time (`'event_date': '20200206'`) and got also an extra field called
`direction`.

Now lets read them into a `DataFrame` and check how spark perceives them.
{% highlight scala %}
import spark.implicits._

val df1 = spark.read.json(Seq(event1).toDS)
val df2 = spark.read.json(Seq(event2).toDS)

df1.show
// +---------+----------+----+----+----+----+
// |driver_id|event_date| lat| lng| utc|uuid|
// +---------+----------+----+----+----+----+
// |      aaa|  20200205|33.3|33.3|1000|   1|
// +---------+----------+----+----+----+----+

df2.show
// +---------+---------+----------+----+----+----+----+
// |direction|driver_id|event_date| lat| lng| utc|uuid|
// +---------+---------+----------+----+----+----+----+
// |        N|      aaa|  20200206|33.3|33.3|2000|   2|
// +---------+---------+----------+----+----+----+----+
{% endhighlight %}

### Writing the events
Now we will write the events using Hudi, with some simple configuration.
{% highlight scala %}
// Write the first event
df1.write.format("org.apache.hudi").options(getQuickstartWriteConfigs).option(PRECOMBINE_FIELD_OPT_KEY, "utc").option(RECORDKEY_FIELD_OPT_KEY, "uuid").option(PARTITIONPATH_FIELD_OPT_KEY, "event_date").option(TABLE_NAME, "drivers").mode(SaveMode.Append).save("/tmp/hudi/drivers")
// Write the second event with the extra field.
df2.write.format("org.apache.hudi").options(getQuickstartWriteConfigs).option(PRECOMBINE_FIELD_OPT_KEY, "utc").option(RECORDKEY_FIELD_OPT_KEY, "uuid").option(PARTITIONPATH_FIELD_OPT_KEY, "event_date").option(TABLE_NAME, "drivers").mode(SaveMode.Append).save("/tmp/hudi/drivers")
{% endhighlight %}
The `getQucikstartWriteConfigs` options, are just demo values for the [`hoodie.insert.shuffle.parallelism`][hudi-parallelism] and 
[`hoodie.upsert.shuffle.parallelism`][hudi-parallelism] parameters.

The [`PRECOMBINE_FIELD_OPT_KEY`][hudi-precombine] option is used to determine which row to write when getting the same key. It will write the 
row that has the largest value in the specified field. In the example we use the `utc` field that represents the 
epoch time of the event. Which means, that the latest event with the same key will be written.

The [`RECORDKEY_FIELD_OPT_KEY`][hudi-key] option is used to determine which field to use as the key of the row. In the example we use `uuid`
which is just a unique id for the event.

The [`PARTITIONPATH_FIELD_OPT_KEY`][hudi-partitionby] option is used to determine by which field to partition the data when writing. In the example
we use the `event_date` field, which represents the date when the event happened, as I expect that most of the queries
would be at least time filtered.

The [`TABLE_NAME`][hudi-tablename] option is used to mark which table to register in [Hive][apache-hive]. It is a 
mandatory option, but in our example it is meaningless.

We use the `SaveMode.Append` to append the events, otherwise if `SaveMode.Overwrite` was used, it would have overwritten
the whole folder that is mentioned in the `.save` method.

Now as we finished with writing the events, we can move to try and read it.

## Reading the data

### Basic read
Reading Hudi files, is as easy as reading parquet files using spark, just need to mention the relevant `format`.
{% highlight scala %}
val hudiDF = spark.read.format("org.apache.hudi").load("/tmp/hudi/drivers/*")
{% endhighlight %}

The result is:
{% highlight scala %}
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+----------+----+----+----+----+
// |_hoodie_commit_time|_hoodie_commit_seqno|_hoodie_record_key|_hoodie_partition_path|   _hoodie_file_name|driver_id|event_date| lat| lng| utc|uuid|
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+----------+----+----+----+----+
// |     20200209101151|  20200209101151_0_2|                 2|              20200206|4f227f5a-1a0f-49c...|      aaa|  20200206|33.3|33.3|2000|   2|
// |     20200209101146|  20200209101146_0_1|                 1|              20200205|e578a74b-b7f8-464...|      aaa|  20200205|33.3|33.3|1000|   1|
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+----------+----+----+----+----+
{% endhighlight %}

As we can see, we get some more Hudi metadata columns, but we are missing the `direction` field, as spark uses the 
schema of the first partition.

### Merge Schema read
Instead of the basic read, we can ask spark to [merge the schemas][spark-merge] of all the files it is processing. As it sounds it is
a relatively expensive operation, so it is turned off by default. There are several way to turn it on. In the next 
example we are going to use it as an `option` when reading the files.
{% highlight scala %}
val hudiDF = spark.read.format("org.apache.hudi").option("mergeSchema", "true").load("/tmp/hudi/drivers/*")
{% endhighlight %}
Now the output is as we expected it to be:
{% highlight scala %}
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+----------+----+----+----+----+---------+
// |_hoodie_commit_time|_hoodie_commit_seqno|_hoodie_record_key|_hoodie_partition_path|   _hoodie_file_name|driver_id|event_date| lat| lng| utc|uuid|direction|
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+----------+----+----+----+----+---------+
// |     20200209101151|  20200209101151_0_2|                 2|              20200206|4f227f5a-1a0f-49c...|      aaa|  20200206|33.3|33.3|2000|   2|        N|
// |     20200209101146|  20200209101146_0_1|                 1|              20200205|e578a74b-b7f8-464...|      aaa|  20200205|33.3|33.3|1000|   1|     null|
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+----------+----+----+----+----+---------+
{% endhighlight %}

### Reducing the performance penalty
In order to reduce the performance penalty, we did some work around for our use case.
Instead of just reading all the files with `mergeSchema`, we only read the latest partition with it.
Extract the schema, and then read all the other partitions we are interested in with that schema.
{% highlight scala %}
// Read latest files
val hudiDF1 = spark.read.format("org.apache.hudi").load("/tmp/hudi/drivers/20200206")
// Read earlier files using the schema of the latest file, without using mergeSchema
val hudiDF2 = spark.read.format("org.apache.hudi").schema(hudiDF1.schema).load("/tmp/hudi/drivers/20200205")
// Result
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+---------+----------+----+----+----+----+
// |_hoodie_commit_time|_hoodie_commit_seqno|_hoodie_record_key|_hoodie_partition_path|   _hoodie_file_name|direction|driver_id|event_date| lat| lng| utc|uuid|
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+---------+----------+----+----+----+----+
// |     20200209101146|  20200209101146_0_1|                 1|              20200205|e578a74b-b7f8-464...|     null|      aaa|  20200205|33.3|33.3|1000|   1|
// +-------------------+--------------------+------------------+----------------------+--------------------+---------+---------+----------+----+----+----+----+
{% endhighlight %}
As we can see, we got the `direction` field with a default value of `null`.

That's all folks.
Thanks for reading !

[apache-hudi]: https://hudi.apache.org/
[apache-spark]: https://spark.apache.org/
[apache-hive]: https://hive.apache.org/
[hudi-parallelism]: https://hudi.apache.org/docs/configurations.html#withParallelism
[hudi-precombine]: https://hudi.apache.org/docs/configurations.html#PRECOMBINE_FIELD_OPT_KEY
[hudi-key]: https://hudi.apache.org/docs/configurations.html#RECORDKEY_FIELD_OPT_KEY
[hudi-partitionby]: https://hudi.apache.org/docs/configurations.html#PARTITIONPATH_FIELD_OPT_KEY
[hudi-tablename]: https://hudi.apache.org/docs/configurations.html#forTable
[spark-merge]: https://spark.apache.org/docs/latest/sql-data-sources-parquet.html#schema-merging
[gist]: https://gist.github.com/igorbasko01/4a1d0cf7c06a5b216382260efaa1f333