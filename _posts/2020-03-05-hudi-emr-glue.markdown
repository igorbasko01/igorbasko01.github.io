---
layout: post
title:  "Hudi On EMR with GLUE catalog"
date:   2020-03-08 11:06:00 +0200
categories: hudi spark glue hive aws emr
---
## Overview
In this post I will describe the steps that I've taken to create an EMR cluster 
that syncs Hudi tables to GLUE catalog.

## Pre-requisites
When creating an EMR cluster, it should install at least `Hive` and `Spark` as the applications.
Also the following configuration should be supplied to the cluster:
```json
{
  "classification": "hive-site",
  "properties": {
    "hive.metastore.client.factory.class": "com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory",
    "hive.metastore.schema.verification": "false"
  }
},
{
  "classification": "spark-hive-site",
  "properties": {
    "hive.metastore.client.factory.class": "com.amazonaws.glue.catalog.metastore.AWSGlueDataCatalogHiveClientFactory"
  }
}
```
After that the cluster is ready for use.

## A code example
And here is the code that I used to sync the table as part of a data creation.
Using the following spark shell command: 
```shell
spark-shell --packages org.apache.hudi:hudi-spark-bundle_2.11:0.5.1-incubating,org.apache.spark:spark-avro_2.11:2.4.4 --conf 'spark.serializer=org.apache.spark.serializer.KryoSerializer' --conf "spark.sql.hive.convertMetastoreParquet=false"
```
And the following code snippet:
```scala
import org.apache.hudi.QuickstartUtils._
import org.apache.hudi.DataSourceWriteOptions.{PARTITIONPATH_FIELD_OPT_KEY, PRECOMBINE_FIELD_OPT_KEY, RECORDKEY_FIELD_OPT_KEY, HIVE_SYNC_ENABLED_OPT_KEY, HIVE_TABLE_OPT_KEY, HIVE_PARTITION_FIELDS_OPT_KEY}
import org.apache.hudi.config.HoodieWriteConfig.TABLE_NAME
import org.apache.spark.sql.{SaveMode, SparkSession}

import spark.implicits._

val event1 = "{'uuid': '1', 'utc': 1000, 'event_date': '2020/02/05', 'driver_id': 'aaa', 'lat': 33.3, 'lng': 33.3}"

val df1 = spark.read.json(Seq(event1).toDS)

df1.show()

df1.write.format("org.apache.hudi")
    .options(getQuickstartWriteConfigs)
    .option(PRECOMBINE_FIELD_OPT_KEY, "utc")
    .option(RECORDKEY_FIELD_OPT_KEY, "uuid")
    .option(PARTITIONPATH_FIELD_OPT_KEY, "event_date")
    .option(TABLE_NAME, "drivers")
    .option(HIVE_SYNC_ENABLED_OPT_KEY, "true")
    .option(HIVE_TABLE_OPT_KEY, "drivers")
    .option(HIVE_PARTITION_FIELDS_OPT_KEY, "event_date")
    .mode(SaveMode.Overwrite)
    .save("s3://<some-bucket>/hudi")
```
After the command finishes, a `drivers` table is created in the `default` database.

That is all folks.