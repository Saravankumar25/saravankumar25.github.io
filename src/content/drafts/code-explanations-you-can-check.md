---
title: Code explanations you can actually check
date: 2026-10-12
summary: How Unfold explains an unfamiliar codebase, and why every answer points back to the code itself.
draft: true
---

Joining a new team often means opening a project with thousands of files and no map. The README tells you how to install it, but not why the pieces are arranged the way they are. Ask an AI chatbot, and you may get a smooth explanation of how a typical app of that kind works, which is not the same as how this one works. Unfold was built to close that gap.

## What it does

You give Unfold a public code link or a ZIP file. It returns a guide split into chapters, diagrams of how the parts connect, and a chat where you can ask questions. Every answer names the files and lines it is based on, so you can open them and check.

## Read it, never run it

Code from the internet could be harmful. So Unfold only reads the files, the way you would read a book. It never installs or runs anything from the project. This limits what can go wrong, but it also limits what it can know: some behaviour only appears when a program is actually running, so the diagrams show how parts are connected, not everything that happens at runtime.

## Three ways of looking things up

To find the right part of the code, Unfold uses three methods together:

- Exact search, for when you know a name, such as a function called checkLogin.
- Meaning-based search, for when you describe an idea in your own words.
- A map of how pieces depend on each other, for questions like what else breaks if this changes.

Each method catches things the others miss, much like using a book's index, asking a librarian and following its footnotes.

For engineers: this is BM25 for lexical matching, dense vectors in Qdrant for semantic search, and a Neo4j graph for relationships.

## A claim needs a source

A fluent paragraph is easy to write and hard to trust. Unfold grades the claims in its own guide against the evidence it found, and the project tests that check by deliberately breaking things. In those tests, citations and evidence are corrupted on purpose, to confirm the quality check notices. A smoke detector is only useful if you have seen it go off.

## Don't repeat expensive work

Analysing a big project takes many steps and many AI calls. Unfold saves its progress after each step. If a step fails halfway, it picks up from there rather than starting over and paying again for work already done.

## Where it stands

Unfold works locally, and a cloud setup for AWS has been written and checked on a local machine, but I am not claiming it is deployed. Quality scores in the project's documents come from specific test projects and are not guarantees for every language or codebase.

## The takeaway

The best way to make an AI explanation trustworthy is not a longer prompt or a bigger model. It is making the AI show its sources, so that anyone, technical or not, can follow the trail and decide for themselves.
