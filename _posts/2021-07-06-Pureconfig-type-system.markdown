---
  layout: post
  title: "An example of Pureconfig's Sealed Families"
  categories: scala pureconfig
  date:   2021-07-07 00:00:00 +0200
  published: true
---
## Overview
In this post I will show, how we leveraged [PureConfig](https://pureconfig.github.io/), and were able to use
its [Sealed Families](https://pureconfig.github.io/docs/overriding-behavior-for-sealed-families.html)
feature in order to have multiple configuration options
for the same resource.

Or more specifically, how we allowed to pass in our configuration,
different types of authentication configurations when creating an
RDS connection configuration.

## What is Pureconfig
PureConfig is Github's library for basically converting configuration files
into Scala Classes, more specifically and common, into case classes.

It is pretty simple to load a Typesafe supported configuration file into a case class using that
library, as simple as the following configuration and code:
```json
"db-conn": {
    "host": "localhost"
    "port": 5432
    "user": "admin"
    "password": "admin"
}
```

```scala
import pureconfig._
import pureconfig.generic.auto._

object Main extends App {
  case class DBConn(host: String, port: Int, user: String, password: String)
  case class ServiceConf(dbConn: DBConn)

  val conf = ConfigSource.default.load[ServiceConf]

  println(conf) // Right(ServiceConf(DBConn(localhost,5432,admin,admin)))
}
```
As we can see, it is pretty straightforward. We define a couple of case classes
that describe the configuration file, and ask pureconfig to create an instance
of that class filled with the correct values.
## What is a Sealed Family
A Sealed Family allows us to create a sealed family of case classes which allows
us to create different types of configuration options, depending on the type
that we specify.

For example if we have different authentication options for our database connection,
one option is to connect by user/password and the other one is to use
user/IAM Token (for AWS RDS as an example), we can define them using a sealed trait,
and some case classes.

We would see that exact example in the following sections.

## Why do we use it
In our case as I have already mentioned, we rely on that feature for our connection
to a Database. As we are using the AWS RDS service, we have also enabled there
the IAM authentication method. Which means that the password for connecting to the
Database is generated using an AWS `RDSIamAuthTokenGenerator`. For that generator
some IAM related configurations are needed. An example of how to generate a real
token you can find in my previous [post]({% post_url 2021-04-29-HikaricCP-RDS-IAM %}).

But of course there are cases where we want to check our service locally, and so
we would want to connect using a simple user/password option.

A sample configuration with IAM (`./resources/db-iam.conf`):
```json
"db-conn": {
    "host": "localhost"
    "port": 5432
    "user": "admin"
    "auth": {
        "type": "iam"
        "iam": {
            "region": "us-west-2"
            "assumed-role": "arn:aws:iam::9999999999:role/some-role"
            "assume-role-session-name": "my-session"
        }
    }
}
```

A sample configuration with simple password (`./resources/db-password.conf`):
```json
"db-conn": {
    "host": "localhost"
    "port": 5432
    "user": "admin"
    "auth": {
        "type": "password"
        "value": "admin"
    }
}
```
As we can see those configurations should create two different case classes.
The `type` attribute, will tell PureConfig which case class to use.
The next section will contain a working example with some explanations.
## Implementation
The first basic configuration is needed for the IAM configuration that was mentioned
in the previous section:
```scala
case class IamConf(region: String, assumedRole: String, assumeRoleSessionName: String)
```
We would like to allow the previously mentioned `DBConn` case class to handle two types
of authentications. The IAM one, and a simple password one.

For that we will create a `sealed trait` that will combine both of the options:
```scala
sealed trait DBAuth
case class password(value: String) extends DBAuth
case class iam(iam: IamConf) extends DBAuth
```
We will call that trait `DBAuth` and extend the options (case classes) with that trait.

The simple `password` option, will just contain the password itself.

The `iam` option, will contain all the relevant fields that were mentioned in the `IamConf` case class.

And now the `DBConn` case class would look like this:
```scala
case class DBConn(host: String, port: Int, user: String, auth: DBAuth)
```
We can notice that there is an `auth` field, that is of type of the `DBAuth` trait. And it will accept
correctly the type of the auth that is specified in the configuration file.

The `ServiceConf` case class stays the same:
```scala
case class ServiceConf(dbConn: DBConn)
```

So now, if we load the configuration files for each of the types we would get the following results:
```scala
ConfigSource.file("./resources/db-password.conf").load[ServiceConf]
// Right(ServiceConf(DBConn(localhost,5432,admin,password(admin))))

ConfigSource.file("./resources/db-iam.conf").load[ServiceConf]
// Right(ServiceConf(DBConn(localhost,5432,admin,iam(IamConf(us-west-2,arn:aws:iam::9999999999:role/some-role,my-session)))))
```

All is good, but there is a little problem. If we want to access the `auth` fields,
we are unable to do it easily as the `DBAuth` trait doesn't contain any common fields
with the extending case classes.

Which means, that this code won't work:
```scala
configPass.map(_.dbConn.auth.password)
```
Because `DBAuth` doesn't have a `password` attribute.

# Common attribute
Basically what we tried to achieve with the `DBAuth` configuration. Is to have a
single place for having the password that is needed for the connection. It can
come from different configuration types, but eventually it should return for us a
password.

So basically we have a common attribute for both implementations, and it is the
`password` attribute.

For the simple `password` configuration type, we will just return the password that
is written in the configuration.

But, for the `iam` configuration type, we would want to use the IAM attributes
to generate a token that we would use as the password.

Because we would need to generate the token whenever we call the `password` attribute,
we would want to make that attribute a function. So we would add a method that is
called `password` to the `DBAuth` trait, and implement it in each of the subtypes:
```scala
sealed trait DBAuth {
    def password: String
}

case class password(value: String) extends DBAuth {
    override def password: String = value
}
case class iam(iam: IamConf) extends DBAuth {
    override def password: String = TokenGenerator(iam).getToken
}

// Just a dummy class for the token generation feature.
case class TokenGenerator(iam: IamConf) {
    def getToken: String = "some token"
}
```
Now it is possible to call the following code, in order to get the appropriate password:
```scala
configPass.map(_.dbConn.auth.password)
// Right(admin)

configIam.map(_.dbConn.auth.password)
// Right(some token)
```
# More Beautification
Currently if we would like to access the user and password attributes, it would
look a bit finicky, at least to me.
Let's look at the following example:
```scala
val confPass = configPass.getOrElse(throw new RuntimeException) // Extract the configuration object or throw an exception.
confPass.dbConn.user
confPass.dbConn.auth.password
```
We can see that the path to the user and to the password, is a bit different.
I would prefer to have the password on the same level as the user. The solution is
pretty easy, we can add a method to the `DBConn` that would shorten the path for us.
Like this:
```scala
case class DBConn(host: String, port: Int, user: String, auth: DBAuth) {
    def password: String = auth.password
}
```
And now it is possible to call the `password` attribute on the same level as the `user` attribute.
```scala
val confPass = configPass.getOrElse(throw new RuntimeException) // Extract the configuration object or throw an exception.
confPass.dbConn.user
confPass.dbConn.password
```
And it will call the appropriate `password` method of the appropriate `DBAuth` implementation.



Hope this post was helpful, thank you for reading.
