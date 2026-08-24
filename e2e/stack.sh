#!/usr/bin/env bash

set -euo pipefail

readonly e2e_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly compose_file="${e2e_directory}/compose.yml"
readonly compose_project="takobox-e2e"
readonly -a compose=(
	docker compose
	--project-name "${compose_project}"
	--file "${compose_file}"
)

stack_pid=""

cleanup() {
	local exit_code=$?
	trap - EXIT INT TERM

	if [[ -n "${stack_pid}" ]] && kill -0 "${stack_pid}" 2>/dev/null; then
		kill -TERM "${stack_pid}" 2>/dev/null || true
	fi

	"${compose[@]}" down --volumes --remove-orphans || true

	if [[ -n "${stack_pid}" ]]; then
		wait "${stack_pid}" 2>/dev/null || true
	fi

	exit "${exit_code}"
}

trap cleanup EXIT
trap 'exit 0' INT TERM

"${compose[@]}" down --volumes --remove-orphans

declare -a up_args=(--force-recreate)
if [[ "${E2E_SKIP_BUILD:-}" != "1" ]]; then
	up_args+=(--build)
fi

"${compose[@]}" up "${up_args[@]}" &
stack_pid=$!

if wait "${stack_pid}"; then
	stack_exit_code=0
else
	stack_exit_code=$?
fi

stack_pid=""
exit "${stack_exit_code}"
