/* Sleepwalker Sam — level data
   Loaded via <script src="levels.js"> so it works over file:// without CORS errors.
   Edit levels with editor.html, which will download an updated levels.js to replace this file. */

var SW_LEVELS = [
  {
    "id": 1,
    "name": "Wake Up Call",
    "hint": "Rotate the green arrow before Sam walks past it.",
    "floors": [
      {
        "cols": 12,
        "rows": 7,
        "cells": [
          "WWWWWWWWWWWW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WWWWWWWWWWWW"
        ],
        "pieces": [
          { "type": "start", "x": 1,  "y": 3, "dir": "E" },
          { "type": "exit",  "x": 10, "y": 5 },
          { "type": "arrow", "x": 10, "y": 3, "dir": "N", "fixed": false },
          { "type": "arrow", "x": 1,  "y": 5, "dir": "E", "fixed": true  }
        ]
      }
    ]
  },
  {
    "id": 2,
    "name": "Mind the Gap",
    "hint": "Rotate the bridge to match Sam's direction, then redirect him south.",
    "floors": [
      {
        "cols": 12,
        "rows": 8,
        "cells": [
          "WWWWWWWWWWWW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFHFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WWWWWWWWWWWW"
        ],
        "pieces": [
          { "type": "start",  "x": 1,  "y": 4, "dir": "E" },
          { "type": "exit",   "x": 10, "y": 6 },
          { "type": "bridge", "x": 5,  "y": 4, "dir": "V", "fixed": false },
          { "type": "arrow",  "x": 10, "y": 4, "dir": "N", "fixed": false },
          { "type": "arrow",  "x": 1,  "y": 6, "dir": "E", "fixed": true  }
        ]
      }
    ]
  },
  {
    "id": 3,
    "name": "Double Gap",
    "hint": "Two bridges need rotating. Work fast — Sam won't wait.",
    "floors": [
      {
        "cols": 12,
        "rows": 8,
        "cells": [
          "WWWWWWWWWWWW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFHHFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WWWWWWWWWWWW"
        ],
        "pieces": [
          { "type": "start",  "x": 1,  "y": 4, "dir": "E" },
          { "type": "exit",   "x": 10, "y": 6 },
          { "type": "bridge", "x": 5,  "y": 4, "dir": "V", "fixed": false },
          { "type": "bridge", "x": 6,  "y": 4, "dir": "V", "fixed": false },
          { "type": "arrow",  "x": 10, "y": 4, "dir": "N", "fixed": false },
          { "type": "arrow",  "x": 1,  "y": 6, "dir": "E", "fixed": true  }
        ]
      }
    ]
  },
  {
    "id": 4,
    "name": "Going Up",
    "hint": "Floor 1: redirect Sam to the elevator. Floor 2: bridge the gap.",
    "floors": [
      {
        "cols": 12,
        "rows": 7,
        "cells": [
          "WWWWWWWWWWWW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WWWWWWWWWWWW"
        ],
        "pieces": [
          { "type": "start",    "x": 1,  "y": 3, "dir": "E" },
          { "type": "arrow",    "x": 5,  "y": 3, "dir": "N", "fixed": false },
          { "type": "arrow",    "x": 5,  "y": 5, "dir": "E", "fixed": true  },
          { "type": "elevator", "x": 10, "y": 5, "toFloor": 1, "toX": 1, "toY": 3, "toDir": "E" }
        ]
      },
      {
        "cols": 12,
        "rows": 7,
        "cells": [
          "WWWWWWWWWWWW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFHFFFW",
          "WFFFFFFFFFFW",
          "WFFFFFFFFFFW",
          "WWWWWWWWWWWW"
        ],
        "pieces": [
          { "type": "start",  "x": 1,  "y": 3, "dir": "E" },
          { "type": "exit",   "x": 10, "y": 5 },
          { "type": "bridge", "x": 7,  "y": 3, "dir": "V", "fixed": false },
          { "type": "arrow",  "x": 10, "y": 3, "dir": "N", "fixed": false },
          { "type": "arrow",  "x": 1,  "y": 5, "dir": "E", "fixed": true  }
        ]
      }
    ]
  }
];
