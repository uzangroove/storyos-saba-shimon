#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "${script_dir}/.." && pwd)"

# Production on Netlify is a static Story OS deployment from /public.
# Do not invoke the Vinext/Cloudflare/OpenAI-hosting toolchain there.
if [[ "${NETLIFY:-}" == "true" ]]; then
  echo "Netlify static Story OS build: validating public files..."

  required_files=(
    "${project_root}/public/index.html"
    "${project_root}/public/storyos.html"
  )

  for file in "${required_files[@]}"; do
    if [[ ! -f "${file}" ]]; then
      echo "Missing required static deploy file: ${file}" >&2
      exit 1
    fi
  done

  echo "Preparing the 30 StoryOS story-hour covers for direct download..."
  node "${project_root}/scripts/package-story-covers.mjs"

  downloads_dir="${project_root}/public/downloads"
  archive_path="${downloads_dir}/storyos-30-covers.zip"
  rm -f "${archive_path}"

  if command -v zip >/dev/null 2>&1; then
    (
      cd "${downloads_dir}"
      zip -q -r "storyos-30-covers.zip" "storyos-30-covers"
    )
  else
    echo "The Netlify build image does not provide the zip command." >&2
    exit 1
  fi

  cover_count="$(find "${downloads_dir}/storyos-30-covers" -maxdepth 1 -type f | wc -l | tr -d ' ')"
  if [[ "${cover_count}" != "30" ]]; then
    echo "Expected 30 packaged covers, found ${cover_count}." >&2
    exit 1
  fi
  if [[ ! -s "${archive_path}" ]]; then
    echo "Cover ZIP was not created." >&2
    exit 1
  fi

  echo "Static Story OS files are ready in public/. 30-cover ZIP created successfully."
  exit 0
fi

# Local / non-Netlify build keeps the original verified Vinext workflow.
# Run helper scripts explicitly through bash so executable file modes do not matter.
if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec bash "${script_dir}/sites-env.sh" -- bash "$0" "$@"
fi

command -v timeout || {
  echo "build-verified.sh requires GNU timeout." >&2
  exit 69
}

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Running bounded vinext build..."
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build

bash "${script_dir}/validate-artifact.sh"
