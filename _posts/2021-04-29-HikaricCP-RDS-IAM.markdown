---
  layout: post
  title: "HikariCP with RDS IAM authentication"
  categories: scala AWS RDS hikaricp
  date:   2021-05-02 00:00:00 +0200
  published: true
---
# Overview
As I tried to describe in the title, apparently using a ConnectionPool on Postgres RDS with the 
IAM authentication is not that straightforward. 

One of the caveats of the IAM authentication, is that the token that is generated is available for 15 minutes.
Which means that after 15 minutes a new connection needs to regenerate a token. But the connection pool that 
we chose doesn't have a built-in option to pass some token generator, or some similar capabilities.

For that we have created a simple `DataSource` that would generate a new token when a `getConnection` method
is called.

The whole solution is described in the following sections.

# How to authenticate with an IAM
In order to do an IAM Authentication with RDS, we are using the AWS Java SDK.
And more specifically the following services:
1. AWSSecurityTokenServiceClientBuilder - In order to fetch the credentials.
2. RdsIamAuthTokenGenerator - To generate the RDS token using the credentials.

Both services are pretty straight forward, but in any case, this is how we fetch the credentials:
```scala
val stsClient = AWSSecurityTokenServiceClientBuilder.standard
      .withRegion(regionName)
      .build

val roleRequest = new AssumeRoleRequest()
      .withRoleArn(assumedRole)
      .withRoleSessionName(assumeRoleSessionName)

val roleResponse = stsClient.assumeRole(roleRequest)
val sessionCredentials = roleResponse.getCredentials

new BasicSessionCredentials(
      sessionCredentials.getAccessKeyId,
      sessionCredentials.getSecretAccessKey,
      sessionCredentials.getSessionToken
)
```

After we have the basic credentials, we can start creating the RDS token:
```scala
val generator = RdsIamAuthTokenGenerator.builder
      .credentials(new AWSStaticCredentialsProvider(credentials))
      .region(region)
      .build

generator.getAuthToken(
      GetIamAuthTokenRequest.builder
        .hostname(rdsConf.host)
        .port(rdsConf.port)
        .userName(rdsConf.userName)
        .build
)
```
The `rdsConf` is just a configuration object that we use to hold the relevant configuration for RDS.

Now that we have the authentication token, we can now use it as the password for connecting to our RDS instance.

But bear in mind that this token is only valid for 15 minutes. A small note here, if a connection was
established using that token, then while the connection is still open, it will work for more than 15 minutes.
But once the connection is broken the same token can't be used to reconnect if the
15 minutes expiry time has passed.

# How to define the connection pool
We went with using HikariCP as our connection pooling solution.
It was pretty straight forward to initialize it and start using it.
With a few lines of code we were able to replace our previous non CP solution.
Here is how we initialize it:
```scala
val hikariConf = new HikariConfig()
hikariConf.setJdbcUrl(rdsConf.url)
hikariConf.setDataSource(new PGCustomDataSource(rdsConf, buildConnectionProperties))

val hikariDataSource = new HikariDataSource(hikariConf)

DSL.using(hikariDataSource, SQLDialect.valueOf(rdsConf.driver.dbType))
```
The `PGCustomDataSource` is our implementation of the datasource, where we refresh the
RDS IAM token. We will see the solution in the next step.

The `buildConnectionProperties` is just some more properties that we use to enable `SSL`
connection to the RDS.

Basically after creating the `HikariDataSource` we pass it to our database abstraction
framework, which in our case is jOOQ.

# Updating the password when a connection is requested
The most naive approach for updating the password, is just to override the `getConnection` method
of the data source.
In our case we are connecting to a postgres DB, so we were using the `PGSimpleDataSource`
and overriding its `getConnection` method. Well actually we were overriding the one in
`BaseDataSource` which the `PGSimpleDataSource` extends.
The code is pretty simple:
```scala
class PGCustomDataSource(rdsConf: RdsConf, connectionProperties: Properties) extends PGSimpleDataSource {
  override def getConnection: Connection = {
    connectionProperties.setProperty("user", rdsConf.userName)
    connectionProperties.setProperty("password", rdsConf.password)
    DriverManager.getConnection(rdsConf.url, connectionProperties)
  }
}
```
The `getConnection` method fetches the user and password from the configuration and
passes it to the `DriverManager`. Similar to what is going on in the `getConnection` of
`BaseDataSource`.

One note though, the `rdsConf.password` is actually a method, that generates the token.
We did a neat trick with that configuration where it can generate a password or fetch one
from the configuration object directly, using some [pureconfig](https://github.com/pureconfig/pureconfig) magic.

And that is it, now our connection pool can refresh the RDS IAM tokens and allow our
service to continue working.


Thanks for reading !
