**Quiz Application – Specification**

# **1\. Stakeholder**

QuizLab s.r.o. (fictional) is a small Slovak start-up of four people, founded by former computer science students. Its mission is to make creating and taking quizzes so simple that anyone can make a quiz in a few minutes, whether for learning or for fun.

The company plans to release the application for free, without ads and without mandatory registration, in order to build a community of users and quiz creators. Later, it intends to introduce a paid plan for schools and companies (e.g. storing results, statistics, private quizzes for teams). Revenue from this plan will fund the operation of the application, so that the free version can remain free, ad-free and without limitations in the long term. Until then, the company needs to keep operating costs low and collect as little user data as possible.

# **2\. Goals**

* **G1 Improving knowledge:** People who use the application measurably improve their knowledge and understand the topic, not only memorise answers.  
* **G2 Learning from mistakes:** Users learn from their mistakes through explanations and by repeating incorrectly answered questions.  
* **G3 Quick self-testing:** Anyone can quickly test their knowledge of any topic.  
* **G4 Easy quiz creation:** Creating a quiz is simple and requires no technical skills.  
* **G5 Sharing and discovery:** Quizzes are easy to share and to discover in a public catalogue.  
* **G6 Simpler than the alternatives:** Creating, taking and editing a quiz is faster and easier to understand than in competing tools, so that new users choose our application and can use it without any instructions. This simplicity is the main advantage the company relies on to win users from established competitors.  
* **G7 Satisfaction and return:** Users are satisfied with the application and want to return to it and recommend it to others.

# **3\. Success Measures**

Success is evaluated in usability testing with at least 5 participants. Measures comparing our application with Google Forms are evaluated in comparative testing: each participant performs the same tasks in both tools, half of the participants starting with our application and half with Google Forms.

* **Knowledge improvement (G1, G2):** Participants take a 10-question quiz on an unfamiliar topic, review the explanations, repeat the incorrectly answered questions and retake the whole quiz. Their average score on the retake is at least 30 percentage points higher than on the first attempt.  
* **Understanding (G2):** After reading an explanation, at least 80 % of participants can explain in their own words why a previously missed answer is correct.  
* **Perceived learning (G1):** At least 80 % of participants agree with the statement "I learned something new" (4 or higher on a 5-point scale).  
* **Creating a quiz (G4, G6):** Participants create a quiz with 5 questions and explanations (given content) at least 30 % faster than in Google Forms.  
* **Editing a quiz (G4, G6):** Participants change a question and its correct answer in an existing quiz in under 1 minute, and faster than in Google Forms.  
* **Sharing and taking a quiz (G3, G5, G6):** A participant shares a quiz and another participant starts answering it within 1 minute, without registration or instructions, and faster than in Google Forms.  
* **Completing tasks without help (G3, G4, G6):** At least 80 % of participants complete each core task (create, edit, share and take a quiz, repeat incorrect questions) without any hint from the moderator, and they need fewer hints than in Google Forms.  
* **Preference (G6, G7):** At least 80 % of participants state they would choose our application over Google Forms for creating a learning quiz.  
* **Satisfaction (G7):** At least 80 % of participants rate their willingness to use the application again at 4 or higher on a 5-point scale.  
* **System Usability Scale (G7):** Average SUS score of at least 70\.

# **4\. Competition Analysis**

* **Kahoot:** Engaging and gamified, very good for live quizzes in a classroom. However, it is designed for teacher-led sessions rather than self-study, and many features require a paid plan.  
* **Quizlet:** Huge library of study sets and effective flashcard and learning modes. However, the free version has ads and an aggressive paywall on key study features.  
* **Moodle:** Offers a wide range of question types and detailed settings. However, it is a complex learning management system designed for teachers and institutions, difficult for casual users, and requires an account.  
* **Sporcle:** Popular, fun trivia quizzes on a wide range of topics. However, it is focused on entertainment rather than learning (no explanations of answers) and contains a lot of ads.  
* **Google Forms:** Familiar and easy to use, with a quiz mode and basic answer feedback. However, it is a general-purpose form tool, has no quiz catalogue and no way to repeat incorrectly answered questions.

**Summary:** Existing tools are either aimed at teachers and institutions (Kahoot, Moodle), restrict important features behind a paywall or overload users with ads (Quizlet, Sporcle), or are not designed for quizzes at all (Google Forms). Users expect quick and free access, use on mobile devices, a simple way to create quizzes and clear feedback on their answers. Our application targets this gap: a simple, free tool focused on self-study and learning from mistakes, where quizzes can be taken without registration.

We analyse Moodle more closely because it is the closest to our use case.

***Strengths:***

* Explanations for each answer option, hints and general feedback with the full solution  
* Retrying a question after a hint  
* Random questions from a question bank, so retakes differ  
* Statistics for teachers  
* Free, open source and widely used at schools and universities

***Weaknesses:***

* Complex setup  
* No learning from mistakes over time: incorrect answers aren't collected or repeated  
* Students can't easily create their own practice quizzes  
* Requires an institutional account  
* dated interface  
* weak on mobile

***Implications for our application:***

* Automatically collect and repeat incorrectly answered questions  
* Simple, mobile-friendly self-study without registration

We also analyse Google Forms in more detail because teachers widely use it for simple, free quizzes:

***Strengths:***

* Free  
* Automatic grading using an answer key  
* Optional feedback for correct and incorrect answers, including links to study materials  
* Overview of frequently missed questions for the creator  
* Respondents can usually take a quiz without signing in

***Weaknesses:***

* General-purpose form tool with limited question types  
* No hints and no retrying a question during the quiz  
* No question bank: only question and option order can be shuffled  
* No learning from mistakes: incorrect answers aren't collected or repeated  
* No catalogue of quizzes to discover or reuse  
* Creators need a Google account

***Implications for our application:***

* At least the same ease of use and fast access  
* Add what Forms lacks: repetition of incorrectly answered questions

## **5\. Functional Requirements**

**F1 Creating and editing a quiz (G4, G6)**  
 A creator can create a quiz without registration. A quiz has a title, a short description, tags and at least one question (F2). The creator can add, edit, reorder and delete questions, and the application points out anything missing (e.g. a question without a correct answer) before saving. After saving, the creator receives a private edit link; only a person with this link can edit or delete the quiz. The link is also remembered on the creator’s device and the “My quizzes” page lists all quizzes created there. Deleting a quiz requires confirmation.

**F2 Question types (G1, G4)**

* Single choice: two or more options, exactly one correct.  
* Multiple choice: two or more options, one or more correct; the answer is correct only if exactly the correct options are selected.  
* True/false: the user marks a statement as true or false.  
* Numeric answer: the user enters a number; the creator defines the correct value and an optional allowed tolerance.  
* Matching: the user pairs each item in the left column with an item from the right column, shown in random order; the answer is correct only if all pairs are correct.  
* Ordering: the user arranges items, shown in random order, into the correct sequence; the answer is correct only if the whole order is correct.

Each question can include an optional explanation of the correct answer, and each incorrect option can include an optional explanation of why it is wrong.

**F3 Taking a quiz (G3, G6)**  
 Anyone with a link, or who finds the quiz in the catalogue, can take it without logging in. Before starting, the user sees the quiz description and number of questions and chooses whether to get feedback after each question or at the end. Questions are shown one at a time with progress; until finishing, the user can go back and change answers. At the end, the user sees their score and an overview of their answers and the correct ones; for each incorrectly answered question, the overview explains why the user’s answer is wrong and why the correct answer is right. Results are not stored on the server; only a short history of taken quizzes is kept in the user’s browser (F6).

**F4 Learning from mistakes (G1, G2)**  
 The user sees whether each answer was correct, the correct answer and its explanation, either after each question or at the end. After finishing the quiz, the user can choose to:

* repeat only the incorrectly answered questions, again and again until all of them are answered correctly, or  
* retake the whole quiz from the beginning.

Both options are also available after each repeated round.

**F5 Sharing (G5)**  
 The creator chooses whether a quiz is public (listed in the catalogue and search) or unlisted (accessible only via its link), and can change it later. After saving, the creator can copy the share link with one action. The share link only allows taking the quiz, never editing it.

**F6 Catalogue and search (G3, G5)**  
 Users can browse public quizzes, each shown with its title, description, tags and number of questions. Results are divided into pages. To find a suitable quiz, users can:

* search by text matching titles and tags,  
* filter by one or more tags at once, choosing from a list of the most used tags; only quizzes with all selected tags are shown,  
* filter by length: short (up to 10 questions), medium (11–25) or long (over 25),  
* sort results by newest, most popular (how many times the quiz was started), number of questions or alphabetically.

The application also remembers quizzes the user has taken in the past and shows them in a “Recently taken” list with the date and the last score, so the user can easily return to them. In the catalogue, already taken quizzes are marked with the last score and can be hidden, so the user can focus on new ones. This history is stored only in the user’s browser (cookies), is never sent to or stored on the server, and the user can clear it at any time.

**F7 Forking a quiz (G4, G5)**  
 A user can create a copy of any public quiz, including all questions and explanations. The copy is a new, unlisted quiz with its own edit link, which the user can freely modify. The original quiz is not affected, and the copy links to it.

# **6\. Non-functional Requirements**

* **Responsive design:** The application works on mobile phones and desktops.  
* **Accessibility:** Accessible also for people with disabilities, according to WCAG 2.2 level AA.  
* **Browser support:** Current versions of Chrome, Firefox, Safari and Edge.  
* **Security:** Protection against XSS, since content is written by users. Only the author can modify their quiz.  
* **Privacy:** Minimal personal data is collected. Individual results are not stored on the server; the history of taken quizzes is kept only in the user's browser (GDPR).  
* **Extensibility:** 	The architecture allows adding future paid features for 	organizations (e.g. storing results, statistics) without limiting the free version.

## **7\. Technology and Deployment**

The application will be built as a single SvelteKit (TypeScript) web application with server-rendered pages, styled with Pico CSS for a responsive and accessible layout. Quizzes will be stored in a Cloudflare D1 (SQLite) database, while quiz results are evaluated in the browser and never stored on the server. Instead of user accounts, each author receives a private edit link with a secret key, so quizzes can be created and taken without registration, but only the author can edit them. The application will run on Cloudflare Workers (free plan) at a permanent public URL, deployed automatically from our GitHub repository.

# **8\. Schedule**

#### **Round 1: Specification, user research, prototypes**

| Activity | Date |
| ----- | ----- |
| This specification | 1.10. – 25.10. |
| User research: interviews with students and teachers | 13.10. – 20.10. |
| Primary persona (student) | 18.10. – 23.10. |
| Secondary persona (teacher) | 18.10. – 23.10. |
| Use case: taking a quiz & learning from mistakes (student) – before/after scenario | 22.10. – 27.10. |
| Use case: creating & sharing a quiz (teacher) – before/after scenario | 22.10. – 27.10. |
| Wireframes for both use cases | 24.10. – 31.10. |
| Storyboards for both use cases | 27.10. – 2.11. |
| Prototype (paper/Figma) for one use case | 29.10. – 4.11. |
| Testing preparation: reserve slot, recruit 2 testers, testing tasks, roles | 29.10. – 4.11. |
| Rehearsal testing | 5.11. |
| **Initial submission** | **8.11.** |
| Testing session (recorded) | 11.11. |
| Editing and uploading videos | 12.11. – 14.11. |
| Testing report | 12.11. – 14.11. |
| Fixing wireframes, storyboards and prototype | 12.11. – 15.11. |
| **Improved submission** | **15.11.** |
| Team review | 19.11. |

#### **Round 2: App Version 1**

| Activity | Date |
| ----- | ----- |
| Updated specification: functions implemented in R2 (F1–F6) | 16.11. – 22.11. |
| Wireframes/storyboards for functions not prototyped in R1 | 16.11. – 22.11. |
| Question format and DB design | 16.11. – 19.11. |
| Project / dev environment setup, deployment setup, site layout | 19.11. – 23.11. |
| **Initial submission** | **22.11.** |
| Home screen, creating a quiz \+ sharing links (F1, F2, F5) | 23.11. – 28.11. |
| Catalogue and search (F6) | 24.11. – 29.11. |
| Taking a quiz, results (F3) | 25.11. – 30.11. |
| Learning from mistakes (F4) | 28.11. – 1.12. |
| Editing and deleting with token, “My quizzes” (F1) | 30.11. – 3.12. |
| Improving documentation according to R1 feedback | 26.11. – 6.12. |
| Qualitative review (lab 7): contrast AA, validity, mobile, navigation | 3.12. – 6.12. |
| Testing preparation: reserve slot, 2 new testers, tasks, screen recording | 30.11. – 8.12. |
| Testing session (recorded) | 9.12. |
| Editing and uploading videos | 10.12. – 12.12. |
| Testing report | 10.12. – 12.12. |
| Fixing app UI | 10.12. – 13.12. |
| Updating documentation \+ CHANGES.md | 10.12. – 13.12. |
| **Improved submission (app URI)** | **13.12.** |
| Team review | 17.12. |

#### **Round 3: App Version 2**

| Activity | Date |
| ----- | ----- |
| Receiving requests from lecturers | 17.12. |
| Updated specification: R3 functions (F7 \+ requested features) and plan | 17.12. – 20.12. |
| **Initial submission** | **20.12.** |
| Updating personas/scenarios if needed | 21.12. – 23.12. |
| Wireframes and storyboards for new features | 21.12. – 30.12. |
| Prototype testing of new features | 29.12. – 3.1. |
| Implementation | 2.1. – 10.1. |
| Organizing own testing sessions: testers, recording | 4.1. – 11.1. |
| Testing report | 11.1. – 14.1. |
| Fixing app | 11.1. – 15.1. |
| Updating documentation \+ CHANGES.md | 13.1. – 16.1. |
| **Improved submission (URIs of both versions, videos)** | **17.1.** |
| Team review | 21.1. |

# **9\. Budget**

| Category | R1 | R2 | R3 | Total |
| ----- | ----- | ----- | ----- | ----- |
| User research | 15 | – | – | 15 |
| Design (personas, scenarios, wireframes, storyboards, prototype) | 40 | 8 | 14 | 62 |
| Usability testing (preparation, sessions, videos, reports) | 25 | 20 | 26 | 71 |
| Implementation (setup, development, deployment, fixes) | – | 54 | 25 | 79 |
| Documentation and management (specification, updates, submissions) | 20 | 23 | 15 | 58 |
| **Total** | **100** | **105** | **80** | **285** |

## **10\. Team and Responsibilities**

The team consists of three members: A, B and C. Non-technical work is done together to keep the design consistent, while technical work is split so that every member contributes to every part of the application. The workload is planned to be balanced, at approximately 95 person-hours per member.

A \- Filip Aufricht  
B \- Alex Hascik  
C \- Hoang Nam Nguyen

### **Common work**

Common activities are discussed and decided by the whole team. One member acts as the editor, who writes and finalises the document.

| Activity | How we work | Editor |
| ----- | ----- | ----- |
| Specification | discussed together, written by the editor | A |
| User research | interview guide prepared together, each member conducts 2–3 interviews, findings synthesised together | B |
| Wireframes and storyboards | designed together in one shared Figma file with common components for a consistent interface | C |
| Prototype | built together from the wireframes | B |
| Updated specifications (R2, R3) | discussed together, written by the editor | A |

### **Personas and scenarios**

Each persona has an author, who also acts as its ambassador during design decisions.

| Member | Task |
| ----- | ----- |
|  A | Primary persona (student) and its before/after scenario |
|  B | Secondary persona (teacher) and its before/after scenario |
|  C | Shared Figma components and review of competitors’ interfaces (Kahoot, Quizlet, Google Forms) as input for the wireframes |

### **Usability testing**

Each testing session requires three distinct roles. The roles rotate between rounds. The operator also edits the session video and the observer writes the testing report.

| Round | Moderator | Operator (+ video) | Observer (+ testing report) |
| ----- | ----- | ----- | ----- |
|  R1 | A | C | B |
|  R2 | B | A | C |
|  R3 | C | B | A |

### **Implementation**

Each function is split into three parts: the user interface (pages, HTML, CSS, accessibility), client logic (state, form validation, quiz evaluation) and the server (API endpoints, database queries, input validation). Before work on a function starts, the team agrees on its data types and API, so that all parts can be developed in parallel. Every change is reviewed by another team member.

| Function | User interface | Client logic | Server |
| ----- | ----- | ----- | ----- |
| Project setup and deployment | – | – | C |
| Question format and database design | together | together | together |
| Site layout (header, footer, navigation) | A | – | – |
| Creating and sharing a quiz (F1, F2, F5) | A | B | C |
| Taking a quiz and results (F3) | B | C | A |
| Learning from mistakes (F4) | C | A | – (review: B) |
| Editing, deleting, “My quizzes” (F1) | C | B | A |
| Catalogue and search (F6, R3) | A | C | B |
| Forking (F7, R3) | B | – | C |
| Features requested in R3 | split when known |  |  |

The qualitative review of the application is split by area: A checks contrast and visual design, B checks HTML validity and semantics, and C checks mobile layout and browser compatibility.

### **Other responsibilities**

| Responsibility | Member |
| ----- | ----- |
| Team lead: deadlines, communication with lecturers, submissions | A |
| Documentation updates and CHANGES.md | A |
| Deployment and keeping previous versions online | C |

## **Team time budget**

| Category | A | B | C | Total |
| ----- | ----- | ----- | ----- | ----- |
| User research | 5 | 5 | 5 | 15 |
| Design | 22 | 23 | 17 | 62 |
| Usability testing | 24 | 23 | 24 | 71 |
| Implementation | 23 | 26 | 30 | 79 |
| Documentation and management | 25 | 18 | 15 | 58 |
| **Total** | **99** | **95** | **91** | **285** |

