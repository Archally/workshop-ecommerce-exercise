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

## Reference model

A reference model of this shop will be published separately later, so you can compare your model
with it.

## Licence

The application code in `code/` is licensed under the Apache License, Version 2.0; see `LICENSE`.
Third-party dependencies keep their own licence terms.
