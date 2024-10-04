# Frontend Instructions

Use this guide for frontend work in the project.

It uses Next.js, Tailwind, Shadcn, and Framer Motion.

Write the complete code for every step. Do not get lazy. Write everything that is needed.

Your goal is to completely finish whatever the user asks for.

## Steps

- All new components should go in `/components` at the root (not in the app folder) and be named like `example-component.tsx` unless otherwise specified
- All new pages go in `/app` DO NOT CREATE THEM ELSEWHERE
- All new actions go in `/actions` and the items file is `/actions/items-actions.ts`


## Reminders

- Use the Next.js 14 app router
- Try and group components into folders

## Requirements

- All data fetching should be done in a server component and pass the data down as props
- Client components (useState, hooks, etc) require that 'use client' is set at the top of the file
- useRouter should be imported from next/navigation
