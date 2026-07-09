\# vision.md



\# GitHub Middle-earth RPG Engine



\## Purpose



The GitHub Middle-earth RPG Engine transforms GitHub activity into an RPG-style progression journey through Middle-earth.



Instead of displaying raw GitHub metrics, the engine converts contributions into XP and visualises progression as a character travelling from The Shire to Mount Doom.



The primary output is a static SVG suitable for embedding in a GitHub README.



\---



\# Product Vision



Developers should feel like they are progressing through a game world rather than accumulating statistics.



The engine should answer the following questions within 3 seconds:



\- Where am I?

\- How much progress have I made?

\- What title have I earned?

\- What is my next destination?



\---



\# Core Gameplay Loop



GitHub Activity

→ XP

→ Journey Progress

→ Achievements

→ SVG Update



GitHub Actions execute this process automatically on a daily basis.



\---



\# MVP Goals



A user must be able to:



1\. Fork the repository

2\. Configure their GitHub username

3\. Enable GitHub Actions

4\. Generate a journey SVG

5\. Embed the SVG into a README

6\. Observe progression over time



\---



\# Primary Output



journey.svg



Contains:



\- Current XP

\- Progress %

\- Current Location

\- Current Title

\- Achievement Count

\- Journey Map

\- Character Position



\---



\# Design Philosophy



1\. Engine over widget

2\. SVG-first output

3\. Deterministic progression

4\. No randomness

5\. Historical journey tracking

6\. Theme-driven architecture

7\. Configurable progression rules

8\. Future theme support



\---



\# MVP Success Criteria



The MVP is successful if:



\- SVG updates automatically

\- Progress feels meaningful

\- Location is understood immediately

\- Historical journey data is recorded

\- Repository can be forked and configured in minutes

