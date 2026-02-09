---
description: End session workflow to automatically push changes and sync
---

1. Check current git status
2. If there are changes, automatically add all files:
   `git add .`
3. Generate a meaningful commit message based on the recent changes.
4. Commit the changes:
   `git commit -m "commit message"`
// turbo
5. Push changes to origin:
   `git push`
   
Confirm to the user that all code has been pushed and it is now safe to switch computers.
