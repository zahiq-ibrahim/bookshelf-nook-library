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

## Project rules
- Routing is TanStack Router (file routes), not React Router; auth pages use `ssr: false` + `beforeLoad` because the token lives in localStorage.
- All API calls live in `src/lib/api.ts`; book shapes (SearchResult / SavedBook / ShelfBook) and mappers live in `src/lib/books.ts` — keep them separate.
- Styling is hand-written CSS classes in `src/styles.css` (no UI kit components) so the cabinet stays hand-designed.
