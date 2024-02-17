const template = `
# ===================================================================
#
# DB Schema to be used by @nxn/db for generating queries and metadata
# metadata can be sent to front application for generating forms.
# this schema is used by a "db model" for executing queries.
#
# customise it for your needs : add your fields, and specific 
# views / queries etc.
#
# check @nxn/db for details
# ====================================================================

name: MY_SCHEMA
title: Schema title here

# field to be used as record key
id: id

# should we use a field prefix (ex. _ in mysql to avoid forbidden names)
dbFieldPrefix: ""

# always true
outputWithoutPrefix: true

# collection name
table: MY_SCHEMA

fields:
  id:
    type: integer

  uid:
    type: string

  creator:
    type: string
    title: Creator

# fields to include to where clause
where:
  id: true
  uid: true

# specific views : redefine here list of fields and queries for list, record etc.
views:
  list:
    fields: "*"
    where:
      id: true
      uid: true

  record:
    fields: "*"
    where:
      id: true
      uid: true

`;

module.exports = template;