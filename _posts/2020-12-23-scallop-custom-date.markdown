---
layout: post
title:  "Using custom date argument parser in scallop"
date:   2020-12-25 00:00:00 +0200
categories: scallop
---
## Overview
I have recently discovered [scallop](https://github.com/scallop/scallop), a simple Scala CLI parsing library.
And in this post I will describe how I have added a custom argument parser that would take a string that represents
a date and transform it into a `LocalDate` object, or fail if the date is invalid.

In my recent projects I mostly write Spark Jobs that process several previous days worth of data.
So one of the most used arguments for my Spark jobs is a date, so I was looking for an easy way
to pass that argument and also validate that it is a valid date.

## My Scallop basics
The basic argument parser class for all my projects looks something like this:
```scala
class ArgumentsParser(arguments: Seq[String]) extends ScallopConf(arguments) {
  val appName = opt[String](name = "app-name", descr = "Application name to use", required = true)
  val date = opt[String](name = "date", descr = "Date to process", required = true)
  verify()
}
```
As you can see, I basically need two arguments:
1. `appName` - The name I want to give to the spark application.
2. `date` - The date that I want spark to process.

After running the app with the `--help` option, I will get the following output:
```scala
  // -a, --app-name  <arg>   Application name to use
  // -d, --date  <arg>       Date to process
  // -h, --help              Show help message
```

But in this case, the date object is just a `String`. And I prefer to work with a `LocalDate`.
Especially if I want to process several past days. For example the last 7 days.

So the first change that I would do, is to allow the `date` argument to have a default date, if not entered.
And also that this default would be of type `LocalDate`.
```scala
class ArgumentsParser(arguments: Seq[String]) extends ScallopConf(arguments) {
  val appName = opt[String](name = "app-name", descr = "Application name to use", required = true)
  val date = opt[LocalDate](name = "date", descr = "Date to process", default = Some(LocalDate.now().minusDays(1)))
  verify()
}
```
In the above example, I have created a default for the `date` argument, which provides a `LocalDate` object
with yesterdays date.

But if I would like to provide any date, I should create some custom converter from a String to a `LocalDate` object.

Fortunately it is very easy to do in `scallop`. All we need to do, is to define an implicit converter.
```scala
class ArgumentsParser(arguments: Seq[String]) extends ScallopConf(arguments) {
  implicit val dateConverter = singleArgConverter[LocalDate](LocalDate.parse)
  val appName = opt[String]("app-name", descr = "Application name to use", required = true)
  val date = opt[LocalDate](name = "date", descr = "Date to process", default = Some(LocalDate.now().minusDays(1)))
  verify()
}
```
Now it is possible to pass a string argument that represents a date. And it would be converted to a `LocalDate`.

For example, the following arguments will fill the variables as follows:
```scala
// --app-name sample-app --date 2020-12-23
val arguments = ArgumentsParser(args)
println(s"App name: ${arguments.appName()}, Date: ${arguments.date()}")
// App Name: sample-app, Date: 2020-12-23
```
And that is great, but what happens if an invalid date is provided? The error message is not that grate.
```scala
// --app-name sample-app --date 2020-12-40
// [scallop] Error: Bad arguments for option 'date': '2020-12-40' - wrong arguments format
```
It tells us that there is some issue, but not explaining exactly what.

Luckily for us, `scallop` provides a way to handle that with an error handler function that we can pass to
the converter.

```scala
class ArgumentsParser(arguments: Seq[String]) extends ScallopConf(arguments) {
  implicit val dateConverter = singleArgConverter[LocalDate](LocalDate.parse, error => Left(error.getMessage))
  val appName = opt[String]("app-name", descr = "Application name to use", required = true)
  val date = opt[LocalDate](name = "date", descr = "Date to process", default = Some(LocalDate.now().minusDays(1)))
  verify()
}
```
And now, when we provide an invalid date, it shows us a more meaningful message.
```scala
// --app-name sample-app --date 2020-12-40
// [scallop] Error: Bad arguments for option 'date': '2020-12-40' - Text '2020-12-40' could not be parsed: Invalid value for DayOfMonth (valid values 1 - 28/31): 40
```

And... That is all for this time. Thanks for reading.
