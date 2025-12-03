var init_data = {
    kids: [
        {
            "id": "3",
            "nick_name": "Andy",
            "dob_mm": 8,
            "dob_yyyy": 2018, active: true
        },
        {
            "id": "4",
            "nick_name": "Susan",
            "dob_mm": 5,
            "dob_yyyy": 2018, active: true
        }
    ],
    question_set_templates: [
        {
            id: "5",
            name: "P1_Term1_English",
            version: 202512011515,
            prompt: "Create a Primary 1 Term 1 English assessment appropriate for a child aged {AGE}. Include simple vocabulary, phonics, and basic sentence understanding.",
            active: true
        },
        {
            id: "6",
            name: "P2_Term1_Math",
            version: 202512011520,
            prompt: "Generate a Primary 2 Term 1 Math assessment for a child aged {AGE}. Cover addition, subtraction, shapes, and simple word problems.",
            active: true
        }
    ],
    question_sets: [
        {
            "id": 9,
            "name": "P1_Term1_English_202512021514",
            "active": true,
            "question_set_template_id": "5",
            "question_set_template_version": 202512011515,
            "max_score": 20,
            "sections": [
                {
                    "id": "A",
                    "text": "Fill in the blanks with the appropriate word",
                    "questions": [
                        {
                            "id": "A.1",
                            "question": "___ to bed early every night.",
                            "options": [
                                {
                                    "text": "Go",
                                    "score": 2
                                },
                                {
                                    "text": "Help",
                                    "score": 0
                                },
                                {
                                    "text": "Take",
                                    "score": 0
                                },
                                {
                                    "text": "Wake",
                                    "score": 0
                                }
                            ]
                        },
                        {
                            "id": "A.2",
                            "question": "___ up early in the morning.",
                            "options": [
                                {
                                    "text": "Get",
                                    "score": 2
                                },
                                {
                                    "text": "Sit",
                                    "score": 0
                                },
                                {
                                    "text": "Put",
                                    "score": 0
                                },
                                {
                                    "text": "Cut",
                                    "score": 0
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "B",
                    "text": "Choose the correct word",
                    "questions": [
                        {
                            "id": "B.1",
                            "question": "Which word is the name of an animal?",
                            "options": [
                                {
                                    "text": "Cat",
                                    "score": 2
                                },
                                {
                                    "text": "Hat",
                                    "score": 0
                                },
                                {
                                    "text": "Mat",
                                    "score": 0
                                },
                                {
                                    "text": "Bag",
                                    "score": 0
                                }
                            ]
                        },
                        {
                            "id": "B.2",
                            "question": "Which word starts with the sound 'S'?",
                            "options": [
                                {
                                    "text": "Sun",
                                    "score": 2
                                },
                                {
                                    "text": "Run",
                                    "score": 0
                                },
                                {
                                    "text": "Fun",
                                    "score": 0
                                },
                                {
                                    "text": "Man",
                                    "score": -1
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "id": 10,
            "name": "P2_Term1_Math_202512021530",
            "active": true,
            "question_set_template_id": "6",
            "question_set_template_version": 202512011520,
            "max_score": 25,
            "sections": [
                {
                    "id": "A",
                    "text": "Basic Addition",
                    "questions": [
                        {
                            "id": "A.1",
                            "question": "What is 8 + 5?",
                            "options": [
                                {
                                    "text": "13",
                                    "score": 3
                                },
                                {
                                    "text": "12",
                                    "score": 0
                                },
                                {
                                    "text": "15",
                                    "score": 0
                                },
                                {
                                    "text": "9",
                                    "score": -1
                                }
                            ]
                        },
                        {
                            "id": "A.2",
                            "question": "What is 6 + 7?",
                            "options": [
                                {
                                    "text": "13",
                                    "score": 3
                                },
                                {
                                    "text": "14",
                                    "score": 0
                                },
                                {
                                    "text": "10",
                                    "score": 0
                                },
                                {
                                    "text": "12",
                                    "score": 0
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "B",
                    "text": "Shapes",
                    "questions": [
                        {
                            "id": "B.1",
                            "question": "Which shape has 3 sides?",
                            "options": [
                                {
                                    "text": "Triangle",
                                    "score": 3
                                },
                                {
                                    "text": "Square",
                                    "score": 0
                                },
                                {
                                    "text": "Circle",
                                    "score": 0
                                },
                                {
                                    "text": "Rectangle",
                                    "score": -1
                                }
                            ]
                        },
                        {
                            "id": "B.2",
                            "question": "Which shape has no corners?",
                            "options": [
                                {
                                    "text": "Circle",
                                    "score": 3
                                },
                                {
                                    "text": "Triangle",
                                    "score": 0
                                },
                                {
                                    "text": "Square",
                                    "score": 0
                                },
                                {
                                    "text": "Pentagon",
                                    "score": -1
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ],

  attempts: [
    // NOTE: option indices below are 0-based
    {
        // Andy attempts the P1 English set
      question_set_id: 9,
      kid_id: "3",
      attempt_start: 202512031515,
      attempt_end: 202512031520,
      score: 4, // sum of answer scores
      answers: [
            {
          question_id: "A.1",
                // selected "Cat" (index 0, score 2)
          correct_selected: [
                    0
                ], // indices of options with score > 0 that were selected
          correct_unselected: [], // indices of options with score > 0 that were not selected
          incorrect_selected: [], // indices of options with score <= 0 that were selected
          duration: 25,
          score: 2,
          is_correct: true // all positive-score options selected, no wrong ones
            },
            {
          question_id: "2",
                // selected "Sun" (index 0, score 2)
          correct_selected: [
                    0
                ],
          correct_unselected: [],
          incorrect_selected: [],
          duration: 30,
          score: 2,
          is_correct: true
            }
        ]
    },
    {
        // Susan attempts the P2 Math set
      question_set_id: 10,
      kid_id: "4",
      attempt_start: 202512041600,
      attempt_end: 202512041612,
      score: 6,
      answers: [
            {
          question_id: "1",
                // selected "13" (index 0, score 3)
          correct_selected: [
                    0
                ],
          correct_unselected: [],
          incorrect_selected: [],
          duration: 40,
          score: 3,
          is_correct: true
            },
            {
          question_id: "2",
                // selected "Triangle" (index 0, score 3)
          correct_selected: [
                    0
                ],
          correct_unselected: [],
          incorrect_selected: [],
          duration: 32,
          score: 3,
          is_correct: true
            }
        ]
    }
]
}