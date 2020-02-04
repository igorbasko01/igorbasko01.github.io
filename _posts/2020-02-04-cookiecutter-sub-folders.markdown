---
layout: post
title:  "Creating cookiecutter multiple sub-folders from template"
date:   2020-02-04 20:32:00 +0200
categories: cookiecutter python
---
## Overview
Lately, I needed to update a project's template that we frequently use. Up until then we used some custom python script
that we developed. Which would create a final project folder using some template folder structure (when the script was
created we weren't aware of the cookiecutter project).

For our recent update I've stumbled upon [cookiecutter][cookiecutter-docs], And decided to give it a try.

Overall cookiecutter did pretty much the exact same thing that we needed, and in addition it used the pretty powerful 
[Jinja][jinja-docs] templating engine.

## The issue
One thing that we couldn't find how to solve was, creating multiple sub-folders in the templated project. We wanted to
achieve the following project structure:
```
my_project
    ├── Tables
    │   ├── table1
    │   ├── table2
    │   └── table3
    └── other_folders
```
The number of tables should be dynamic (mentioned in some configuration file).

We tried to use the following approaches to create the mentioned structure.
### Approach #1
Create the following template structure:
```
{% raw %}
{{cookiecutter.prj_name}}
    └── Tables
        └── {% for table in cookiecutter.tables %}{{table}}{% endfor %}
{% endraw %}
```
And use the following `cookiecutter.json`:
{% highlight json %}
{
    "prj_name": "my_project",
    "tables": ["table1", "table2", "table3"]
}
{% endhighlight %}
The result of that approach was:
```
my_project
│   ├── Tables
│   │   └── table1
│   └── other_folders
```
A less desirable result. We realised that maybe the issue with that approach is that cookiecutter assumes a list as 
an options list, so it defaults to only the first option. So we went with a slightly different approach.
### Approach #2
Use the following `cookiecutter.json`:
{% highlight json %}
{
    "prj_name": "my_project",
    "tables": {
        "table1": "table1",
        "table2": "table2",
        "table3": "table3"
    }
}
{% endhighlight %}
And use the following template structure:
```
{% raw %}
{{cookiecutter.prj_name}}
    └── Tables
        └── {% for table in cookiecutter.tables.keys() %}{{table}}{% endfor %}
{% endraw %}
```
This time the result was pretty much the same:
```
my_project
    └── Tables
        └── table2table3table1
```
### Next Steps
As the results were not as expected we decided to try a different approach. This time we went on using 
[CookieCutter's package functions][cookiecutter-funcs] directly from our own Python code.

## The Solution
### Overview
The basic components of the solution are: 
1. A primary template folder 
2. A sub template folder
3. A single `cookiecutter.json`
4. A custom config file: `config.json`
5. A custom python script that creates the final project using CookieCutters functions.

In summary the steps in the custom python script are:
1. Create the project using the primary template folder.
2. Using the `config.json` file, create each table using the sub template.

**Note**: The second step could be done multiple times for different sub templates.

### In Detail
The primary template folder looks as follows:
```
{% raw %}
primay-template
├── cookiecutter.json
└── {{cookiecutter.prj_name}}
    └── Tables
{% endraw %}
```
The sub template folder looks as follows:
```
{% raw %}
table-template
│   ├── cookiecutter.json
│   └── {{cookiecutter.table}}
│       └── 000-create-table.sql
{% endraw %}
```
The `cookiecutter.json` file:
{% highlight json %}
{
    "prj_name": "my_project",
    "table": "some_table"
}
{% endhighlight %}
Please note that it contains only a single entry for the `table` attribute, as this file is going to be overridden by 
the custom config file `config.json`, for each table.

The `config.json` file:
{% highlight json %}
{
  "prj_path": "./",
  "prj_name": "my_project",
  "tables": [
    { "name": "table1"},
    { "name": "table2"},
    { "name": "table3"}
  ]
}
{% endhighlight %}
The `prj_path` attribute, points to the location where the project should be created.

And finally the script that does the magic:
{% highlight python %}
import cookiecutter.main as ccmain
import json
import os
from shutil import copyfile

# Copy the cookiecutter.json from central location to all templates, so we won't need to update each cookiecutter.json
# template manually.
sub_templates = ['./primary-template',
                 './table-template']

for template in sub_templates:
    copyfile('./cookiecutter.json', os.path.join(template, 'cookiecutter.json'))
    
# Load the custom config file.
with open('config.json') as f_config:
    config = json.load(f_config)
    
# Create the project using the primary template.
ccmain.cookiecutter('primary-template', no_input=True, extra_context=config)

# For each table, create a table folder using the sub template.
for table in config['tables']:
    table_config['table'] = table['name']    # Used for cookiecutter.json
    
    # Create the sub folder using the sub template in the correct location
    ccmain.cookiecutter('table-template',
                        no_input=True,
                        extra_context=table_config,    # Overidde the table attribute in the cookicutter.json
                        output_dir=os.path.join(config['prj_path'], config['prj_name'], 'Tables'))
{% endhighlight %}

This is the most basic script, we also enriched it with:
1. Database View definitions (Not just tables).
2. other python scripts.
3. tests folders and files.
4. and much more...

So now our projects contain many features, but they are easily created using CookieCutter and the custom script.

Hope you will find it useful.

[cookiecutter-docs]: https://cookiecutter.readthedocs.io/en/1.7.0/
[cookiecutter-funcs]: https://cookiecutter.readthedocs.io/en/1.7.0/cookiecutter.html
[jinja-docs]: https://palletsprojects.com/p/jinja/
