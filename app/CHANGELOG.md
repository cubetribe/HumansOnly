# Change Log (Started at April 4, 2023)

## 2026-02-27 - Upload + Media Security Hardening (v1.8.5)

-   hardened `/api/upload` request validation with strict `multipart/form-data` and request-size guardrails
-   added declared-vs-detected MIME enforcement and reject-on-mismatch behavior to block spoofed uploads
-   enforced optimizer hard output limits so oversized images fail fast instead of being stored
-   centralized media URL sanitization across profile edit, tweets, replies, and messages APIs
-   restricted accepted media URLs to local uploads and configured storage origins/hosts only
-   switched upload/storage object key suffixes from `Math.random` to crypto-grade random bytes
-   extended live upload smoke with explicit MIME-mismatch negative checks

## 2026-02-27 - CI/Prisma Env Hotfix (v1.8.4)

-   fixed `DIRECT_DATABASE_URL` validation failures in quality scripts by auto-falling back to `DATABASE_URL` when missing
-   limited `.env` sourcing in quality scripts to Prisma steps so `NODE_ENV=development` does not break production builds
-   updated `.env.example` with `DIRECT_DATABASE_URL` to match Prisma schema requirements
-   hardened upload compression smoke script with startup readiness/retry handling for fresh deploy runs

## 2026-02-27 - Adaptive Image Compression Pipeline (v1.8.3)

-   added adaptive upload optimizer with iterative quality + rescale passes per upload type (`profile`, `header`, `post`)
-   introduced per-type output byte budgets with hard caps and automatic fallback encoding
-   normalized uploaded images to web delivery formats (`image/webp` primary, JPEG fallback for hard-limit cases)
-   extended upload API response with compression diagnostics (`outputFormat`, dimensions, target/hard limits, attempt count)
-   added live verification script `scripts/upload-compression-smoke.sh` for large image fixtures and invalid-image rejection checks

## 2026-02-27 - Upload Hardening Hotfix (v1.8.2)

-   hardened `/api/upload` with real image parsing validation and decompression safeguards
-   expanded supported upload types (`AVIF`, `HEIC`, `HEIF`) and aligned stored MIME type with processed output
-   improved upload client error handling for non-JSON/HTTP error responses
-   added strict profile/header file validation + accepted MIME filters in edit profile UI
-   extended Next.js image domain allowlist to include `humans-only.de` to prevent optimizer `400` failures
-   improved `/api/users/preferences` handling for stale/missing user records to avoid avoidable `500` responses

## 2026-02-27 - Hotfix (v1.8.1)

-   fixed frontend API base URL handling to use same-origin calls in the browser
-   added server-only fallback base URL (`INTERNAL_API_BASE_URL`) for route-to-route fetches
-   resolved production auth/session mismatch on `humans-only.de` affecting messaging, profile edit, and settings actions

## 2026-02-27 - Hotfix (v1.5.1)

-   fixed `POST /api/users/create` unhandled hashing failure path by moving password hashing into route `try/catch`
-   restored JSON error handling path and eliminated HTML `500 Internal Server Error` regression on user signup

## 2026-02-27 - Wave 3 Messaging + Notifications Reliability (v1.5.0)

-   added `Message.isRead` field and `POST /api/messages/read` endpoint
-   added `NotificationPreference` model and `GET/POST /api/notifications/preferences`
-   updated `/api/messages/[username]` with `totalUnread`, per-conversation `unreadCount`, and pagination metadata
-   updated `/api/notifications` with `unreadCount` + pagination metadata
-   updated `/api/notifications/create` to respect recipient preference toggles
-   updated message UI to mark conversations as read on open and refresh unread counters
-   deployed migration `20260227212241_add_notification_preferences_and_message_reads`

## 2026-02-27 - Wave 2 Media Pipeline Hardening (v1.4.0)

-   added `MediaAsset` Prisma model for upload audit and moderation metadata
-   added storage abstraction in `src/utilities/storage/server.ts` (`local`, `supabase`, `auto`)
-   hardened `/api/upload` with per-user daily upload count + byte quotas
-   added checksum dedupe/reuse for identical uploads (`reused: true`)
-   extended upload response with `assetId`, `provider`, `moderationStatus`
-   deployed migration `20260227211236_add_media_assets` to production

## 2026-02-27 - Wave 1 Auth Consolidation (v1.3.0)

-   added centralized Clerk-first auth resolver in `src/utilities/auth/session.ts`
-   migrated protected tweets/users/messages/notifications/upload routes to shared auth resolver
-   updated `/api/auth/session` to return canonical session data with `source` metadata
-   removed server dependency on client-sent `tokenOwnerId` for authorization
-   updated frontend fetch + mutation callers to stop sending `tokenOwnerId`
-   removed unused legacy auth dialogs (`LogInDialog`, `SignUpDialog`)

## 2026-02-27 - Hotfix (v1.2.3)

-   added `bcryptjs` fallback for hashing/comparison when native `bcrypt` fails at runtime

## 2026-02-27 - Wave 0 Stabilization (v1.2.2)

-   fixed client action ID transport (`tokenOwnerId`) to use plain UUIDs
-   added backend normalization for legacy quoted UUID payloads
-   required authentication for `/api/upload`
-   fixed `tweets/all` pagination count to exclude replies
-   stabilized unauthenticated UX on Home/Messages/Notifications pages
-   moved verified-human code check to server-side validation in profile edit route
-   redacted sensitive deployment credentials from docs

-   [x] add hash to passwords when creating
-   [x] add auth
-   [x] if auth, return to /home | /explore
-   [x] add regex validation to usernames / yup docs
-   [x] list tweets as last tweeted first
-   [x] add a static @ into username in login and sign up
-   [x] if name is not provided, get username in prisma schema
-   [x] refactor sign up and sign in forms
-   [x] break-word for description
-   [x] add env.example
-   [x] add modal for logout
-   [x] think about test account
-   [x] global loading
-   [x] add global loading as twitter bird with animation
-   [x] tweak useAuth, add loading state for auth loading instead of null
-   [x] optimistic update on likes
-   [x] unlike feature
-   [x] animation on click ? react spring/framer
-   [x] div onClick and cursor pointer for tweets
-   [x] useContext in useAuth?
-   [x] fix the logout sometimes not working as expected
-   [x] authorization wall for create/like/unlike
-   [x] fix middleware, make it useful
-   [x] handle tweet text html-like breaks
-   [x] emote picker in new tweet
-   [x] photo upload in new tweet
-   [x] more compact uploader for photo upload,
-   [x] supabase storage is ok to use for avatars and images? if not use aws
-   [x] clicking images should open full screen images
-   [x] avatar logic
-   [x] handle default avatar / twitter egg
-   [x] fix emoji not opening in the modal
-   [x] complete media link in profile
-   [x] follow/unfollow feature
-   [x] optimistic update on follow/unfollow
-   [x] lazy load tweets / react query implementation for lazy loading
-   [x] add is following you feature
-   [x] complete edit profile page
-   [x] fix url for photos (only short url exist for now, will give error)
-   [x] profile pic, header pic change in profile
-   [x] cascade in postgresql / how to handle deleted tweets
-   [x] refactor uploader in new tweet to prevent unnecessary uploads to the server, only upload if user tweets
-   [x] add delete options for users tweets
-   [x] handle tweet not found error
-   [x] handle user not found error
-   [x] authorization wall for delete/follow/unfollow/edit
-   [x] add retweet feature
-   [x] single tweet page refactor with images
-   [x] header and profile picture click fullscreen preview
-   [x] show retweets in the main flood
-   [x] add reply feature
-   [x] single tweet page shows all replies or only first degree replies?
-   [x] console log every useQuery to find out if any password leaking
-   [x] exlude password in prisma includes:{}, fix types and what includes for all api routes
-   [x] handle errors like "user already exists"
-   [x] add card when hover on tweet profile & username & who retweeted & mentioned
-   [x] complete profile, remove placeholders, desc images and everything
-   [x] think about handling related errors in the fetch folder
-   [x] add global-error.tsx
-   [x] use "use client" if possible
-   [x] change all request type to nextRequest
-   [x] organize overall code/folders
-   [x] autofocus in modals
-   [x] add loading when logging as test account
-   [x] change explore to home, home only followings
-   [x] make settings public, home private
-   [x] progress bar for 280 characters
-   [x] animations on tweets
-   [x] hover effect on avatars
-   [x] custom scrollbar
-   [x] header photo with twitter bird
-   [x] you are not authorized seen as json, do a page for that
-   [x] start working on right sidebar
-   [x] search mechanism, only for users / users and tweets would be better
-   [x] useDeferredValue for search if react query has not have it
-   [x] if auth, show random non-followed 3 people with avatars for user to follow in right side
-   [x] add complete profile reminder
-   [x] add snackbar for some feedback, copy from twitter
-   [x] add footer-like twitter info, github
-   [x] add html dialog for confirmations
-   [x] find a better way to delete tweets other than window.location.replace()
-   [x] find throw new Errors, console.logs, message:, error:, snackbar here, alert(), confirm(),
-   [x] handle home/edit explore/edit and this kind of paths, redirect if requested. or catch all method
-   [x] add twitter blue tick in edit profile
-   [x] change localhost to env or however next handles this
-   [x] add messages feature
-   [x] add images for messaging
-   [x] optimistic update on new messages
-   [x] scroll down to bottom of chat when opening messages
-   [x] add disabled buttons
-   [x] handle username is not found error with snackbar while messaging
-   [x] add new message button on profiles
-   [x] handle users trying to message themselves
-   [x] handle users message click without auth
-   [x] add delete conversations logic
-   [x] finish /home (only followings and user's tweets)
-   [x] add css tooltip for verified blue tick
-   [x] complete share button in related components
-   [x] add notifications
-   [x] add welcome notification
-   [x] handle users getting notifications from themselves
-   [x] handle message notification's frequency
-   [x] message and notifications length, and banner to icon
-   [x] handle isRead function
-   [x] finish /notifications page
-   [x] error handling with onSuccess, onError, throw new Error in fetch responses
-   [x] add next optimized fonts
-   [x] improve new message modal visually
-   [x] add different active icons for left-sidebar
-   [x] sticky page names and back links
-   [x] add dark mode
-   [x] finish /settings page
-   [x] fix favicon problem when path is deeper
-   [x] choose database and vercel serverless locations close
-   [x] make color choice stable by saving it to the localstore
-   [x] activate material ui dark mode when dark mode
-   [x] optimistic updates on maybe tweet creation, retweet especially, try passing isRetweeted as a prop then set onMutate
-   [x] make it responsive

# Deploy 1.0.0 (May 18, 2023)

-   [x] create changelog md
-   [x] update db settings
-   [x] update broken dependencies
-   [x] change host & dns
