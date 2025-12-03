
This document explains the purpose and meaning of each field contained in the `init_data` object.
The structure represents a small assessment system for kids, including templates, question sets, attempts, and user profiles.

---

### 1. **kids**

List of children using the app.

| Field         | Description                                         |
| ------------- | --------------------------------------------------- |
| **id**        | Unique identifier for the child (string or number). |
| **nick_name** | The display name of the child.                      |
| **dob_mm**    | Birth month (1–12).                                 |
| **dob_yyyy**  | Birth year.                                         |
| **active**    | Whether the child is active in the system.          |

**Example**

```json
{ "id": "3", "nick_name": "Andy", "dob_mm": 8, "dob_yyyy": 2018, active: true }
```

---

### 2. **question_set_templates**

A template describes how to *generate* question sets.
It is not the actual quiz, but the configuration for producing quizzes.

| Field       | Description                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| **id**      | Unique identifier for the template.                                                                        |
| **name**    | Human-readable template name.                                                                              |
| **version** | Timestamp used to lock versioned templates.                                                                |
| **prompt**  | Instruction used by the system or AI to generate questions. `{AGE}` may be substituted with the kid’s age. |
| **active**  | Whether the template is available for use.                                                                 |

**Purpose:**
This allows regenerating the same question set later or comparing different versions of generated content.

---

### 3. **question_sets**

An actual set of questions that kids can attempt.
Each set is created from a **question_set_template**.

### Main Fields

| Field                             | Description                                                            |
| --------------------------------- | ---------------------------------------------------------------------- |
| **id**                            | Unique ID of the question set.                                         |
| **name**                          | Name of the question set (usually includes template name + timestamp). |
| **active**                        | Whether the question set can be assigned or attempted.                 |
| **question_set_template_id**      | Which template it was generated from.                                  |
| **question_set_template_version** | Ensures it matches the template version used at generation time.       |
| **max_score**                     | Maximum achievable score for the entire set.                           |
| **questions**                     | Array of individual questions.                                         |

---

#### 3.1 **questions** (Inside each question_set)

Each question includes text and multiple-choice options.

| Field        | Description                         |
| ------------ | ----------------------------------- |
| **id**       | Identifier within the question set. |
| **question** | The actual question text.           |
| **options**  | List of answer options.             |

---

#### 3.2 **options** (Inside each question)

Each option defines the answer text and its scoring value.

| Field     | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| **text**  | The visible answer option.                                        |
| **score** | Scoring (positive = correct, zero = neutral, negative = penalty). |

Notes:

* Systems can support *multiple correct answers*.
* Score > 0 implies a correct option.

---

### 4. **attempts**

Records of kids attempting a question set.
One attempt corresponds to one child attempting one full question set.

### Main Fields

| Field               | Description                                        |
| ------------------- | -------------------------------------------------- |
| **question_set_id** | Which question set was attempted.                  |
| **kid_id**          | Who attempted it.                                  |
| **attempt_start**   | Timestamp (yyyymmddHHMM) when the attempt started. |
| **attempt_end**     | Timestamp when it finished.                        |
| **score**           | Total score obtained across all questions.         |
| **answers**         | Array of per-question attempt details.             |

---

#### 4.1 **answers** (Inside an attempt)

Tracks how each question was answered.

| Field                  | Description                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **question_id**        | The ID of the question being answered.                                             |
| **correct_selected**   | Indices (0-based) of correct options the user selected.                            |
| **correct_unselected** | Indices of correct options the user did *not* select.                              |
| **incorrect_selected** | Indices of wrong options the user selected.                                        |
| **duration**           | Time spent on the question (seconds).                                              |
| **score**              | Score awarded for this question.                                                   |
| **is_correct**         | Boolean: true if all correct answers were selected and no incorrect ones selected. |

---

### ✔ Summary Diagram

```txt
init_data
├── kids[]
├── question_set_templates[]
│     └── prompt
├── question_sets[]
│     └── questions[]
│            └── options[]
└── attempts[]
      └── answers[]
```
