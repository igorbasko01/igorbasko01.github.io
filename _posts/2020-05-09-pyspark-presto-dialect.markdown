---
layout: post
title:  "PySpark + Presto JDBC Dialect"
date:   2020-03-11 00:00:00 +0200
categories: spark presto jdbc glue aws emr
---
## Overview
In this post I will describe how I've created an Apache Spark `JdbcDialect` 
and how I used it in `PySpark`.

Lately there was a request from our ML engineers to supply some unified framework 
that will allow them to run the same code when in some cases the source should 
be Presto and for some cases the same code should use GLUE catalog/S3. 
Same GLUE catalog is also used in Presto.

Our Datalake contains some complex events, with complex structures, that contain
Arrays and Structs.

Currently in spark by default there is no support for arrays when using JDBC,  
[JdbcUtils](https://github.com/apache/spark/blob/master/sql/core/src/main/scala/org/apache/spark/sql/execution/datasources/jdbc/JdbcUtils.scala#L206).
To be able to use arrays directly with Presto and spark, we had to create a
custom [dialect](https://github.com/apache/spark/blob/master/sql/core/src/main/scala/org/apache/spark/sql/jdbc/JdbcDialects.scala#L58).

In the following sections I will describe how I have created one in scala, 
and how we could use it in PySpark.
## Creating the custom dialect
So it is pretty simple, as shown in the overview we need to create a class
that extends Spark's `JdbcDialect`.
It needs to override the `canHandle` method that describes which jdbc url the 
custom dialect can handle. 

And also for our case we also needed to override
the `getCatalystType` that should convert Presto's types into Spark types. Most of
spark default type conversions is good enough. But as noted earlier the Array type
is not supported by default, so we need to create the conversion.

Presto's Array type looks as following: `ARRAY(inner_type)`. For example 
`ARRAY(INTEGER)`.

The following snippet is the `PrestoDialect` that I created.
```scala
package my.company.jdbc

import java.sql.Types
import java.util.Locale

import org.apache.spark.sql.jdbc.JdbcDialect
import org.apache.spark.sql.types._

class PrestoDialect extends JdbcDialect {
    private val arrayTypePat = """ARRAY\(([\w\d\(\)].*)\)"""

    override def canHandle(url: String): Boolean =
        url.toLowerCase(Locale.ROOT).startsWith("jdbc:presto")

    override def getCatalystType(sqlType: Int,
                               typeName: String,
                               size: Int,
                               md: MetadataBuilder): Option[DataType] = {
        if (sqlType == Types.ARRAY) {
            val innerType = stripType(arrayTypePat, typeName) match {
                case Some(inner) if inner.startsWith("ARRAY(") =>
                    throw new IllegalArgumentException(s"Nested arrays are not supported: $typeName")
                case None => throw new IllegalArgumentException(s"The type $typeName is unsupported in ARRAY")
                case Some(inner) => inner
            }

            toCatalystType(innerType).map(ArrayType(_))
        } else None
    }

    /**
    * Strip outer types of the provided type.
    * @param regexPat The regex pattern to use for stripping
    * @param typeName The type to use the strip regex on.
    * @return Inner type of the stripped type.
    */
    private def stripType(regexPat: String, typeName: String): Option[String] = {
        val Pattern = regexPat.r

        typeName match {
            case Pattern(inner) => Some(inner)
            case _ => None
        }
    }

    /**
    * Convert Presto's basic type into spark type.
    * @param typeName Presto's type.
    * @return Spark type.
    */
    private def toCatalystType(typeName: String): Option[DataType] = typeName match {
        case "BOOLEAN" => Some(BooleanType)
        case "INTEGER" => Some(IntegerType)
        case "BIGINT" => Some(LongType)
        case "REAL" => Some(FloatType)
        case "DOUBLE" => Some(DoubleType)
        case "varchar" => Some(StringType)
        case x if x.startsWith("VARCHAR") => Some(StringType)
        case x if x.startsWith("DECIMAL") => throw new IllegalArgumentException("Unsupported Array element DECIMAL. " +
            "Please cast array to REAL or DOUBLE.")
        case _ => None
    }
}
```

Well, after creating this class, compile and package into a jar and now let's 
move to how we can use this class to query presto arrays through pyspark.

## Use in PySpark
In order for us to use the `PrestoDialect` class inside spark, we should load the
jar from the previous step, for the example I've called it: 
`spark-presto-dialect_2.12-1.0.jar` and then import the class itself using
`py4j`. And of course we need to load Presto's
JDBC Driver.

Moreover we need to register the custom dialect into spark, using the 
`JdbcDialects.registerDialect` method. 

All will be shown in the next code snippet:
```python
from pyspark.sql import SparkSession
from py4j.java_gateway import java_import


def get_sparksession():
    return SparkSession\
        .builder\
        .appName("PySpark-Presto")\
        .config("spark.driver.extraClassPath", "../presto-jdbc-0.234.1.jar:../spark-presto-dialect_2.12-1.0.jar")\
        .getOrCreate()

def get_spark_presto_session(spark):
    return spark.read \
        .format("jdbc") \
        .option("driver", "com.facebook.presto.jdbc.PrestoDriver") \
        .option("url", "jdbc:presto://localhost:8889/hive/default") \
        .option("user", "hadoop")\
        .option("numPartitions", "4")


def load_presto_query(spark_presto):
    return spark_presto\
        .option("query", get_sql()) \
        .load()

def get_sql():
    return '''
    SELECT
        ARRAY[1,2,3]
    FROM hive.some_glue_db.some_glue_table 
    '''

if __name__ == "__main__":
    spark = get_sparksession()
    gw = spark.sparkContext._gateway
    java_import(gw.jvm, "my.company.jdbc.PrestoDialect")

    gw.jvm.org.apache.spark.sql.jdbc.JdbcDialects.registerDialect(gw.jvm.com.here.mobility.data.jdbc.PrestoDialect())
    presto_df = load_presto_query(get_spark_presto_session(spark))

    presto_df.show()
    presto_df.printSchema()
```
Well now our ML Engineers are able to load presto arrays directly to 
spark's DataFrames.

Thanks a lot for reading.
        