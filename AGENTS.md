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

- Keep the account-provider boundary in `src/lib/auth.ts` fail-closed until a real provider is connected; browser demo data is never identity or authorization.
- Existing application pages live under the client-only `_protected` layout, retaining their URLs; `/` and `/auth` are public login surfaces and the worker home is `/dashboard`.
- A future account integration must revalidate sessions, attach identity to protected server requests, enforce owner/employer permissions server-side, and map profiles to employee records before exposing the retained demo workflows.
