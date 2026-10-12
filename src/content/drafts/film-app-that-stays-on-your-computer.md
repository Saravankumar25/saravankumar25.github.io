---
title: A film-planning app that never needs the internet
date: 2026-10-12
summary: Why OpenFrame keeps everything on your own computer, and how it still offers an AI helper safely.
draft: true
---

Making a film means juggling a lot of paper: loose ideas, story outline, script, a list of everything needed on set, and a shooting schedule. Most tools split these across different apps and keep your work on someone else's servers. OpenFrame is my attempt at the opposite: one desktop app, where your project is simply a folder on your own computer.

## Your project is a folder

Each film is a normal folder with a database file, a small description file and your media inside it. You can copy it, back it up or delete it like any other folder. There is no account to create and no sign-in. The app does not send usage data anywhere, and it does not listen for connections from other computers.

For engineers: the app is built with Tauri and Rust, with a React and TypeScript interface. Each project uses a SQLite database.

## The screen can't touch your files

A common weak spot in apps like this is the interface itself. In OpenFrame the part you see is not allowed to read your files or reach the internet. Whenever it needs something, it has to ask the Rust core through one narrow, pre-approved doorway. The core then decides what is allowed. Think of the interface as a customer at a counter, and the core as the staff who actually walk into the back room.

## Never lose your work

Every edit is saved the moment you make it, as a complete, finished step. If the computer crashes or the power goes out, the app notices on the next start and offers to continue from the latest save or go back to the last time you pressed Save. Undo and redo work for every change, and they refuse to wipe out something newer you have done since.

When the app is updated and the project format changes, it first makes a verified backup, then upgrades the project in one go. It also refuses to open a project made by a newer version, so an old version can't quietly damage it.

## An AI helper that asks first

OpenFrame has an optional AI assistant. It runs on your computer, using a small model you download once (about 1.1 GB). After that it works offline, and your script is never sent to a cloud service.

The key rule: the AI never changes your project by itself. It shows its suggestions as a list of proposed changes, and nothing happens until you click Apply. The same goes for any step it takes: it can never do more than you are allowed to do.

## Honest status

OpenFrame is pre-release. The foundations are working: creating and opening projects, autosave, crash recovery, undo, file management, search and the offline AI. The creative tools, such as the Story Board, the screenplay editor and the shooting schedule, are still being built. No installer has been released yet.

## Why it matters

Keeping work on your own computer is not only a privacy choice. It is also a design discipline: if nothing relies on a server, then everything important has to be made reliable on the device itself, from saving to recovery to safe upgrades. That discipline is what I enjoyed most about building it.
