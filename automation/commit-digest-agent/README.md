# GitHub Commit Digest Agent

An n8n automation that watches a GitHub repository for new pushes, filters out noise (merge commits), summarizes each real commit in plain language using an LLM, and emails the digest — so you get a readable changelog instead of raw commit messages.

## What it does and for whom

Built for developers (or teams) who want a lightweight, zero-maintenance way to keep a plain-English log of what changed in a repo, without reading raw `git log` output or setting up a full CI/changelog pipeline. Every time someone pushes to the watched repo, this agent turns the commit(s) into a short digest and sends it straight to your inbox.

## Setup (a stranger could follow this)

1. **Create an n8n Cloud account** (or self-host n8n) and create a new workflow.
2. **Add a GitHub node** with the "Push" trigger event:
   - Generate a GitHub Personal Access Token (classic) with scopes: `repo` and `admin:repo_hook`.
   - In the node's credential, set your GitHub username and the token.
   - Set **Repository Owner** and **Repository Name** to the repo you want to watch (use "By Name" mode and type the exact repo, not a URL).
3. **Add a "Split Out" node** after the trigger:
   - Field to split out: `body.commits`
   - This turns a multi-commit push into one item per commit.
4. **Add a "Filter" node** after Split Out:
   - Condition: `{{ $json.message }}` **does not contain** `Merge pull request`
   - This drops merge commits so the digest only covers real work.
5. **Add an LLM node** (this build uses n8n's built-in Gateway credits with Gemini 3 Flash, but any OpenAI/Gemini node works):
   - Resource: Text → Operation: "Message a Model"
   - Prompt:
     ```
     Summarize this git commit into a short digest entry.

     Commit message: {{ $json.message }}
     Author: {{ $json.author.name }}
     Files changed: {{ $json.modified }}

     Write 1-2 sentences describing what changed and why it likely matters. Keep it concise and readable for someone skimming a daily digest.
     ```
6. **Add a Gmail node** ("Send a message"):
   - To: your email
   - Subject: `Commit Digest: {{ $json.content.parts[0].text.slice(0, 40) }}`
   - Message: `{{ $json.content.parts[0].text }}`
   - Connect your Gmail account via OAuth.
7. **Save and activate the workflow** (toggle "Active" in the top right). This registers a live webhook on the repo — from then on, every push triggers the digest automatically.

## Usage example

Push a commit to the watched repo:
```bash
git add .
git commit -m "Fix token refresh race condition"
git push
```
Within seconds, an email arrives summarizing the change in plain language, e.g.:

> "David Wafula updated the `README.md` to test an n8n automation trigger. This change verifies that the integration between the repository and the n8n workflow is functioning as expected."

## Architecture

```
GitHub push
    |
    v
GitHub Trigger node  (listens for "push" events, creates a webhook on the repo)
    |
    v
Split Out node        (body.commits -> one item per commit)
    |
    v
Filter node            (drops commits whose message contains "Merge pull request")
    |
    v
LLM node (Gemini)      (summarizes each commit in 1-2 sentences)
    |
    v
Gmail node              (emails the summary)
```

## Eval results (v2)

Manual end-to-end test performed on 2026-09-07 against the `auth-microservice` repo:

| Test | Result |
|---|---|
| Trigger fires on real push | Pass — webhook created and fired within seconds of `git push` |
| Split Out correctly isolates each commit | Pass — verified with single-commit push; array logic confirmed against GitHub's push payload schema |
| Filter drops merge commits | Pass — non-merge commit correctly landed in "Kept," condition logic verified |
| LLM summary is accurate and concise | Pass — summary correctly described the actual file changed and stayed under 2 sentences |
| Email delivery | Pass — email received in inbox with correct subject and body |

No automated eval suite yet — this is a manual smoke test across the full pipeline, not a scored benchmark. See Limitations below.

## Limitations

- **Only filters merge commits, not bot commits.** If the repo has Dependabot or similar bots pushing directly, their commits will still generate digest entries. A second filter condition on `author.username` would fix this.
- **No batching.** Each commit gets its own LLM call and email. On a repo with frequent multi-commit pushes, this means multiple emails per push rather than one combined digest.
- **No retry/error handling.** If the LLM call or Gmail send fails, the workflow simply errors out for that execution — there's no fallback or alert.
- **Single recipient.** The digest goes to one hardcoded email address; it isn't set up for team distribution.
- **No automated evaluation.** Testing was manual, not backed by a repeatable eval script or test suite.
