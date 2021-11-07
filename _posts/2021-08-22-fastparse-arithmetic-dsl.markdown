---
  layout: post
  title: "Arithmetic AST with fastparse"
  categories: scala fastparse
  date:   2021-08-22 00:00:00 +0200
  published: false
---

## Overview
In our Data Quality platform, we allow users to onboard different types of datasets.
One of our initial goals on the platrform was to provide the ability to write
expectations for those datasets, which in turn help to determine the quality of
the dataset.

The expectations are using the metrics that our platform produces for the datasets.
Example metrics that the platform can produce for each dataset:
- Number of rows.
- Number of rows with null values in specific column.
- Average/Min/Max number of items in a column of type collection.

Basically each metric would return some number, in consequence our expectations
should be able to do some arithmetic expression on those metrics.

A sample expresion could look like: `{null_email}/{count_rows}`

The `{null_email}` placeholder expresses the amount of rows with a `null` value in the
`email` column, and `{count_rows}` expresses the amount of rows in the dataset.
Using the above expression, we get the proportion of rows that have null values
in the email column. On the result of that expression the user can define a threshold
which will describe the expectation.

For example: `{null_email}/{count_rows} < 0.05`

From the above expectation, the user expects that the dataset should contain less
then 5% of rows with null value in the email column.

## fastparse
What is it and why I used it.

## The Solution
Code snippets with explanations.

## Next steps
Adding new functions/syntax for the expression.
