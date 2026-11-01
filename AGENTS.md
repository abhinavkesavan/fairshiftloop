<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Revalidate Cloud identity through the account-provider boundary; browser demo data is never identity or authorization.
- Existing application pages live under the client-only `_protected` layout, retaining their URLs; `/` and `/auth` are public login surfaces and the worker home is `/dashboard`.
- Account roles and employee links are read through authenticated server functions and owner-scoped policies; employer privileges require a private email-bound invitation, never signup metadata.
- Retained demo workflows must remain unmounted until their data has been migrated to owner/employer-scoped Cloud records; an employee link alone does not authorize demo records.
