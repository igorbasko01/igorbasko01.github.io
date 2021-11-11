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
First of all I defined the Expressions that I would expect.
```scala
sealed trait Expression
case class Div(r: Expression, l: Expression) extends Expression
case class Mul(r: Expression, l: Expression) extends Expression
case class Add(r: Expression, l: Expression) extends Expression
case class Sub(r: Expression, l: Expression) extends Expression
case class Num(value: String) extends Expression
case class Metric(id: String) extends Expression
```
It contains the four basic arithmetic expressions, an expression that
represents a number and an expression that represents a Metric.

After that I have defined the actual Fastparse patterns that would map onto
those expressions.
```scala
def number[_: P]: P[Expression] = P(CharIn("0-9").rep(1)).!.map(Num)
def metric[_: P]: P[Expression] = P("{" ~ number.! ~ "}").map(Metric)
def factor[_: P]: P[Expression] = P(number | metric | parens)
def parens[_: P]: P[Expression] = P("(" ~/ addSub ~ ")")

def divMul[_: P]: P[Expression] = P(factor ~ (CharIn("*/").! ~/ factor).rep).map((astBuilder _).tupled)
def addSub[_: P]: P[Expression] = P(divMul ~ (CharIn("+\\-").! ~/ divMul).rep).map((astBuilder _).tupled)
def expr[_: P]: P[Expression] = P(addSub ~ End)
```
The patterns are basically the arithmetic example pattern from the
fastparse [documentation](https://com-lihaoyi.github.io/fastparse/)
But instead of evaluating the result while parsing, it builds the AST.
For the simple metric and number patterns, I map the parsed result directly on
the relevant Expressions.

For the Arithmetic patterns (divMul and addSub) I modified a bit the example
to create the relevant Expressions
```scala
def astBuilder(initial: Expression, rest: Seq[(String, Expression)]): Expression = {
    rest.foldLeft(initial) {
      case (left, (operator, right)) =>
        operator match {
          case "*" => Mul(left, right)
          case "/" => Div(left, right)
          case "+" => Add(left, right)
          case "-" => Sub(left, right)
        }
    }
  }
```

And if we run some tests, we can see the following results
```scala
"the parser" should "create an AST of only numeric expression" in {
    val expression = "3/2"
    val ast = Parser.parse(expression)
    ast shouldEqual Right(Div(Num("3"), Num("2")))
  }

  it should "create an AST of mixed operators" in {
    val expression = "3+4*5"
    Parser.parse(expression) shouldEqual Right(Add(Num("3"), Mul(Num("4"), Num("5"))))
  }

  it should "create an AST with a metric" in {
    val expression = "3+{4}/5"
    Parser.parse(expression) shouldEqual Right(Add(Num("3"), Div(Metric("4"), Num("5"))))
  }
```

The `Parser` object is just a wrapper for the fastparse parser, it just converts the
parsing result into an `Either`.
```scala
object Parser {
  type Error = String
  def parse(expression: String): Either[Error, Expression] =
    fastparse.parse(expression, Patterns.expr(_))
      .fold((e, _, _) => Left(e), (s, _) => Right(s))
}
```

## Next steps
From that simple example we were able to add more "Functions" to the expression
that would be part of the syntax that we support in our Data Quality Expectations.
And that allows us to customize the language of the expectations according to
our user needs.
