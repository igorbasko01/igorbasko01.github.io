---
  layout: post
  title: "Arithmetic AST with fastparse"
  categories: scala fastparse
  date:   2021-08-22 00:00:00 +0200
  published: false
---

## Overview
In our Data Quality platform, we allow users to onboard different types of datasets.
One of our initial goals on the platform was to provide the ability to write
expectations for those datasets, which in turn help to determine the quality of
the dataset.

The expectations are using the metrics that our platform produces for the datasets.
Example metrics that the platform can produce for each dataset:
- Number of rows.
- Number of rows with null values in specific column.
- Average/Min/Max number of items in a column of type collection.

Each metric would return some number, in consequence our expectations
should be able to do some arithmetic expression on those metrics.

A sample expression could look like: `{null_email}/{count_rows}`

The `{null_email}` placeholder expresses the amount of rows with a `null` value in the
`email` column, and `{count_rows}` expresses the amount of rows in the dataset.
Using the above expression, we get the proportion of rows that have null values
in the email column. On the result of that expression the user can define a threshold
which will describe the expectation.

For example: `{null_email}/{count_rows} < 0.05`

From the above expectation, the user expects that the dataset should contain less
then 5% of rows with null value in the email column.

The users would provide these expectations through an API that the platform exposed.
For an easier usage for the user, we allowed them to pass the expression as simple
string, and the service would parse and evaluate it.

But which parser should I use for parsing and evaluating?

## Parsers
For implementation simplicity I chose to use the [jeasy/easy-rules](https://github.com/j-easy/easy-rules)
repository with the MVEL expression language parser. And it worked pretty well.
It allowed me to parse and evaluate the whole expectation out of the box.
But naturally the requirements evolved and we wanted to introduce extra features in the expression itself,
and wanted some more control over the expression language.

As a consequence of the changed requirements, I have started looking for other
libraries that would provide me with more control over the parsing of the expressions.
Our main language is Scala, so I looked for a Scala library that I could have used.

The first option that pops in, is using the [scala-parser-combinators](https://github.com/scala/scala-parser-combinators)
library, as once it was a built-in in the standard Scala library. But after investigating
a bit more, it seemed that it was a pretty slow library, performance wise, so I kept
looking, and found the [FastParse](https://github.com/com-lihaoyi/fastparse) parsing library by Li Haoyi.
The first example of the library was an arithmetic parser, so it was somewhat a breeze
to create the parser that I wanted. The main caveat was, that I didn't want to evaluate
the expression directly when parsed, but instead to create an AST, which I could
evaluate later when providing the relevant metrics.

With a bit of manipulation I was able to create a parser that creates the AST, and
the AST itself would be able to evaluate itself when needed.

## The Solution
Code snippets with explanations.

## Next steps
Adding new functions/syntax for the expression.
