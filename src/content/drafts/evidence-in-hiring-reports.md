---
title: Why every sentence in a hiring report should show its evidence
date: 2026-10-12
summary: How Vivekium keeps hiring fair and checkable, explained for recruiters and engineers alike.
draft: true
---

Imagine two people apply for the same job. One is judged against a long list of skills. The other is judged against a slightly shorter list, because someone edited the job description in between. Both end up in the same ranking, and nobody notices. That is a quiet, very human way for hiring to go wrong, and it is the problem Vivekium is built around.

## Fix the yardstick first

In Vivekium, a hiring manager describes the job, and the tool suggests the skills that matter. People edit that list and save it. Once candidates start taking the assessment, the list is locked for that round. Everyone is measured with the same ruler, and if the job changes later, that is a new round, not a quiet rewrite of the old one.

For engineers: the skills and job level are stored as a frozen snapshot that the grading step reads from. Editing the live job record can't change a result that was already scored.

## A report you can check

After the assessment, each candidate gets a written report. The risk with any AI-written report is that it sounds confident whether or not it has proof. So the report follows a fixed layout, and every claim has to point to the answer or evidence it came from. If a sentence has nothing behind it, it is held back for a person to review instead of being shown as fact.

The idea is simple: a recruiter should be able to click on a statement and see why it was made. Reports are also only ever added to, never overwritten, so there is a record of what was said and when.

## The AI helps. People decide.

The AI reads resumes and suggests which candidates look like a good match. It does not decide who moves forward. Recruiters choose. Customer-facing ratings are written in plain language rather than as a precise-looking number, because a score like 87.3 suggests more certainty than any test can give.

This is worth saying clearly: nothing here claims the system is free of bias. The point is to make the process consistent and open to checking, so mistakes are easier to find and fix.

## Keeping companies' data apart

Many companies share the same platform, so one company must never see another's candidates. Vivekium checks this in two places: in the application, and again in the database itself, using a feature called row-level security. If a developer ever forgets a check in the application, the database still refuses to hand over the wrong rows. It is like having a lock on the room and a second lock on the filing cabinet.

## Slow work happens in the background

Reading documents, transcribing and writing reports with AI can take a while. Instead of making a person stare at a loading screen, the app records the request, answers straight away, and a separate worker finishes the job. If someone clicks twice or the network hiccups, the same job is not run twice.

## What this does not claim

This article describes how the system is designed, based on the project's documentation. It is not a claim about customer numbers, results, or accuracy, and I have not published any customer data or real reports.

## The short version

Lock the yardstick, make every claim traceable, let people make the final call, and keep each company's data in its own room. None of these ideas are flashy, but together they are what make an AI hiring tool something you can reasonably trust.
