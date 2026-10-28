# Workshop exercise: model an ecommerce shop

This repository holds a small ecommerce shop and the documents its team left behind. Your task is
to model the shop from its code and documents with your AI agent, as an Archally Blueprint.

There is no model here, and no answer key. You build the model yourself.

## What is in it

- `code/` - the application: a storefront and a shop administration app, four services (products,
  customers, orders, inventory) and contract tests for the orders service.
- `sources/` - the scattered documentation: meeting notes (DOCX), architecture notes (PDF), boards
  with speaker notes (PPTX), a work plan and an acceptance-test export (XLSX), and a decision record
  (Markdown). The documents do not always agree with each other or with the code.

## How to start

1. Clone this repository and open it in your agent host (Claude Code, Codex, Cursor or another).
2. Get the public schema and validator from
   [github.com/Archally/blueprint-schema](https://github.com/Archally/blueprint-schema) and follow
   its README to set them up.
3. Ask your agent to read `code/` and every document in `sources/`, then to create a Blueprint v2.8
   model in `.blueprint/v2.8/` at the root of this repository.
4. Start with one flow: a customer places an order and stock is reserved. The rest of the shop is
   homework.
5. Validate after each modeling step and fix the errors before you extend the model.

Tips for a good model:

- Cite the original file and the place in it (page, slide, sheet, row) for every fact you take
  from a document.
- Separate code that runs today from behaviour that is only planned.
- When two documents disagree, record both accounts and keep the question open unless a document
  with clear authority settles it.
- Do not invent numbers, risk ratings or test results to make a warning go away.

## Agent and skills

The repository carries a public blueprint-modeling kit: a `blueprint-modeler` agent, fifteen method
skills (domain discovery, DDD, Event Storming, SBVR business rules, capability mapping, schema
gotchas and more) and two commands, `/blueprint-new` and `/blueprint-validate`. It needs no Archally
CLI and no MCP server. Each host picks it up when you open this folder:

- **Claude Code** reads `CLAUDE.md`, which imports `AGENTS.md`, and finds the agent, commands and
  skills in `.claude/`.
- **Codex** reads `AGENTS.md` and the skills in `.agents/skills/`. The custom agent in <!-- public-docs-scan:allow Codex and Cursor read this path -->
  `.codex/agents/` loads once you trust the project; otherwise `AGENTS.md` tells Codex which file to
  follow. Commands are plain files in `.agents/commands/`. <!-- public-docs-scan:allow Codex and Cursor read this path -->
- **Cursor** reads `AGENTS.md`, the skills in `.agents/skills/`, and the agent and commands in <!-- public-docs-scan:allow Codex and Cursor read this path -->
  `.cursor/`.

The agent finds the schema through the `BLUEPRINT_SCHEMA_ROOT` environment variable, or asks you for
the path. Set it to your clone of the schema repository before you start, for example
`export BLUEPRINT_SCHEMA_ROOT=~/src/blueprint-schema`.

## Reference model

A reference model of this shop will be published separately later, so you can compare your model
with it.

## Licence

Everything in this repository, the application code in `code/`, the documents in `sources/` and the
agent and skill files, is licensed under the Apache License, Version 2.0; see `LICENSE`.
Third-party dependencies keep their own licence terms.
