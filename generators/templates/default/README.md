# Drive indexer

## Overview

DESCRIBE YOU APP HERE

## API

GENERATE swagger file and add it in your application under /application/MY APP/documentation.
(use ChatGPT for now, for bootstraping it or swaggerautogen. Soon to be provided by nxn cli... )

cf. [swagger file](/applications/drive_indexer/documentation/indexer.swagger.yml)

## Install

UPDATE BELOW:

```shell
mkdir drive_indexer
cd drive_indexer
git clone https://github.com/PresenceSoft/gdrives_indexer.git .
git submodule update --init --recursive
npm install
```

Create a .firestore file in /client_data/default and copy google credential of service account. In Cloud run, mount the file as a secret.

Then :

```shell
npm run start
```

## Create docker image

### build
```shell
npm run docker
```

### run
```shell
npm run docker:run
```

### deploy
```shell
npm run docker:login
npm run docker:push
```

## Run the scan
To use the service, you need an oAuth token, to be provided via API Endpoint:



## Application Components

This application is based on @nxn framework with a structure :
- services : provider services used by routes and tests
- routes : API endpoints
- nodes : message based services that receive/process and send messages to other nodes. Nodes are useful for creating processing flows (similar to n8n / low code nodes).
- middleware: express middleware components that are used in application (CORS, log, etc.)

### Here is a dependency view of components:

![Application overview](/client_data/default/config_default.README.svg)

## Services Components

DESCRIBE HERE YOUR COMPONENTS


### Dependency Overview

NB. this mermaid preview can be seen when opening the README in github.

GENERATE YOUR MERMAID Graph and copy/paste it here...

```shell
nxg mermaid
```

```mermaid
graph TB;
subgraph main

subgraph Application
    direction LR;
    classDef node fill:#eee,stroke:#eee,color:#333
    classDef route fill:#2080D0,stroke:#eee,color:#fff
    classDef nod fill:#C080C0,stroke:#eee,color:#fff
    classDef service fill:#A9C9EB,stroke:#eee,color:#444
    indexer_route:::route
    indexer_route -- auth -->reuse_google_token;
    indexer_route --> indexer;
    gdrive:::service
    gprofile:::service
    gfiles_locale:::service
    gfiles_model:::service
    gfiles_model -- db -->firestore;
    gfiles_model -- locale -->gfiles_locale;
    gfile_sce:::service
    gfile_sce -- model -->gfiles_model;
    firestore:::service
    clientManager:::service
    clientManager --> gprofile;
    gdrive_locale:::service
    gdrive_model:::service
    gdrive_model -- db -->firestore;
    gdrive_model -- locale -->gdrive_locale;
    gdrive_sce:::service
    gdrive_sce -- model -->gdrive_model;
    indexer:::nod
    indexer --> gdrive;
    indexer --> gprofile;
    indexer --> clientManager;
    indexer -- onDriveStart -->onDriveStart_node;
    indexer -- onFile -->completeFile_node;
    indexer -- onDriveEnd -->onDriveEnd_node;
    onDriveStart_node:::nod
    completeFile_node:::nod
    completeFile_node -- output -->gdrive_export_node;
    completeFile_node --> gdrive;
    gdrive_export_node:::nod
    gdrive_export_node -- output -->kw_extract_node;
    gdrive_export_node --> gdrive;
    kw_extract_node:::nod
    kw_extract_node -- output -->onFileToDB_node;
    kw_extract_node -- foundTagsNodes -->log_map_node_with_tags;
    onFile_node:::nod
    onFileToDB_node:::nod
    onFileToDB_node -- gFileSce -->gfile_sce;
    onFileToDB_node -- output -->log_map_node;
    onDriveEnd_node:::nod
    onDriveEnd_node -- gDriveSce -->gdrive_sce;
    log_map_node:::nod
    log_map_node -- output -->writer_log;
    writer_log:::nod
    log_map_node_with_tags:::nod
    log_map_node_with_tags -- output -->writer_log_with_tags;
    writer_log_with_tags:::nod
end

subgraph Legend
    Route:::route
    Service:::service
    Node:::nod
end
end

style Application fill:#fff,stroke:#999,color:#222
style Legend fill:#eee,stroke:#eee,color:#333
style main fill:#eee,stroke:#eee,color:#eee


```

MODIFY LINK BELOW

Latest version is available here : [mermaid doc](/client_data/default/config_default.README.mmd). 
You need to install mermaid extension to display overview.

NB. mermaid diagramm is generated from the application YAML config, by running nxn cli command:

```shell
nxg mermaid
```

### Notes
