#!/bin/bash

# ============================================
# Chronicle Test Runner
# ============================================
# Interactive & flag-based test runner for Chronicle BDD tests
#
# Usage (flags):
#   ./runner.sh --env prod --region us,aus --tag @login-valid --loop 5 --headless
#   ./runner.sh -e project -r aus -t @smoke -l 3
#   ./runner.sh -e prod -r us -t "@login-valid and @smoke"
#
# Usage (interactive):
#   ./runner.sh
#
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Defaults
ENV=""
REGIONS=""
TAG=""
LOOP=1
HEADLESS="false"
FEATURE=""
INTERACTIVE=true

# ============================================
# ENV FILE MAPPING
# ============================================
get_env_file() {
  case "$1" in
    dev)        echo ".env.dev" ;;
    project)    echo ".env.chronicle" ;;
    prod|production) echo ".env.chronicle.prod" ;;
    *)          echo ".env" ;;
  esac
}

get_env_display() {
  case "$1" in
    dev)        echo "Development" ;;
    project)    echo "project" ;;
    prod|production) echo "Production" ;;
    *)          echo "$1" ;;
  esac
}

# ============================================
# AVAILABLE TAGS (auto-detected from features)
# ============================================
AVAILABLE_TAGS=(
  "@login-valid"
  "@smoke"
  "@p0"
  "@p0x"
  "@login"
  "@roi"
  "@roi-table"
  "@interment"
  "@sales"
  "@person"
  "@feedback"
  "@searchBox"
  "@advance-table"
  "@advancesearch-auth"
  "@advance-search-public"
  "@request-sales-form"
  "@public"
  "@authenticated"
)

# ============================================
# PARSE FLAGS
# ============================================
while [[ $# -gt 0 ]]; do
  INTERACTIVE=false
  case "$1" in
    -e|--env)
      ENV="$2"; shift 2 ;;
    -r|--region)
      REGIONS="$2"; shift 2 ;;
    -t|--tag)
      TAG="$2"; shift 2 ;;
    -l|--loop)
      LOOP="$2"; shift 2 ;;
    -f|--feature)
      FEATURE="$2"; shift 2 ;;
    --headless)
      HEADLESS="true"; shift ;;
    --headed)
      HEADLESS="false"; shift ;;
    -h|--help)
      echo ""
      echo -e "${BOLD}Chronicle Test Runner${NC}"
      echo ""
      echo -e "${CYAN}Usage:${NC}"
      echo "  ./runner.sh                                    # Interactive mode"
      echo "  ./runner.sh [flags]                            # Flag mode"
      echo ""
      echo -e "${CYAN}Flags:${NC}"
      echo "  -e, --env       Environment: dev, project, prod       (required)"
      echo "  -r, --region    Region: aus, us, or aus,us for both   (required)"
      echo "  -t, --tag       Cucumber tag: @login-valid, @smoke    (required unless -f)"
      echo "  -f, --feature   Feature file path (alternative to -t)"
      echo "  -l, --loop      Number of times to repeat (default: 1)"
      echo "  --headless      Run in headless mode"
      echo "  --headed        Run with browser visible (default)"
      echo "  -h, --help      Show this help"
      echo ""
      echo -e "${CYAN}Examples:${NC}"
      echo "  ./runner.sh -e prod -r us,aus -t @login-valid -l 5 --headless"
      echo "  ./runner.sh -e project -r aus -t @smoke"
      echo "  ./runner.sh -e prod -r us -t \"@login-valid and @smoke\" -l 3"
      echo "  ./runner.sh -e project -r aus -f src/features/p0/login.feature"
      echo ""
      echo -e "${CYAN}Available Tags:${NC}"
      printf "  %s\n" "${AVAILABLE_TAGS[@]}"
      echo ""
      exit 0 ;;
    *)
      echo -e "${RED}Unknown flag: $1${NC}"
      echo "Use --help for usage info"
      exit 1 ;;
  esac
done

# ============================================
# INTERACTIVE MODE
# ============================================
if [ "$INTERACTIVE" = true ]; then
  echo ""
  echo -e "${BOLD}${CYAN}========================================${NC}"
  echo -e "${BOLD}${CYAN}   Chronicle Test Runner${NC}"
  echo -e "${BOLD}${CYAN}========================================${NC}"
  echo ""

  # 1. Environment
  echo -e "${BOLD}1. Environment${NC}"
  echo -e "   ${DIM}1)${NC} dev"
  echo -e "   ${DIM}2)${NC} project"
  echo -e "   ${DIM}3)${NC} prod"
  echo ""
  read -p "   Select [1-3]: " env_choice
  case "$env_choice" in
    1) ENV="dev" ;;
    2) ENV="project" ;;
    3) ENV="prod" ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
  esac
  echo -e "   ${GREEN}-> $(get_env_display $ENV)${NC}"
  echo ""

  # 2. Region
  echo -e "${BOLD}2. Region${NC}"
  echo -e "   ${DIM}1)${NC} aus"
  echo -e "   ${DIM}2)${NC} us"
  echo -e "   ${DIM}3)${NC} both (aus + us)"
  echo ""
  read -p "   Select [1-3]: " region_choice
  case "$region_choice" in
    1) REGIONS="aus" ;;
    2) REGIONS="us" ;;
    3) REGIONS="aus,us" ;;
    *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
  esac
  echo -e "   ${GREEN}-> $REGIONS${NC}"
  echo ""

  # 3. Tag or Feature
  echo -e "${BOLD}3. Tag${NC}"
  echo -e "   ${DIM}Popular tags:${NC}"
  for i in "${!AVAILABLE_TAGS[@]}"; do
    printf "   ${DIM}%2d)${NC} %s\n" "$((i+1))" "${AVAILABLE_TAGS[$i]}"
  done
  echo -e "   ${DIM} 0)${NC} Custom tag / feature file"
  echo ""
  read -p "   Select [0-${#AVAILABLE_TAGS[@]}]: " tag_choice
  if [ "$tag_choice" = "0" ]; then
    echo ""
    echo -e "   ${DIM}Enter custom tag (e.g. @my-tag) or feature file path:${NC}"
    read -p "   > " custom_input
    if [[ "$custom_input" == *.feature ]]; then
      FEATURE="$custom_input"
    else
      TAG="$custom_input"
    fi
  elif [ "$tag_choice" -ge 1 ] 2>/dev/null && [ "$tag_choice" -le "${#AVAILABLE_TAGS[@]}" ] 2>/dev/null; then
    TAG="${AVAILABLE_TAGS[$((tag_choice-1))]}"
  else
    echo -e "${RED}Invalid choice${NC}"; exit 1
  fi
  if [ -n "$TAG" ]; then
    echo -e "   ${GREEN}-> $TAG${NC}"
  else
    echo -e "   ${GREEN}-> Feature: $FEATURE${NC}"
  fi
  echo ""

  # 4. Loop
  echo -e "${BOLD}4. Loop (repeat count)${NC}"
  read -p "   How many times? [1]: " loop_input
  LOOP=${loop_input:-1}
  if ! [[ "$LOOP" =~ ^[0-9]+$ ]] || [ "$LOOP" -lt 1 ]; then
    echo -e "   ${YELLOW}Invalid input, defaulting to 1${NC}"
    LOOP=1
  fi
  echo -e "   ${GREEN}-> ${LOOP}x${NC}"
  echo ""

  # 5. Headless
  echo -e "${BOLD}5. Browser mode${NC}"
  echo -e "   ${DIM}1)${NC} Headed (see browser)"
  echo -e "   ${DIM}2)${NC} Headless (no browser)"
  echo ""
  read -p "   Select [1-2]: " headless_choice
  case "$headless_choice" in
    1) HEADLESS="false" ;;
    2) HEADLESS="true" ;;
    *) HEADLESS="false" ;;
  esac
  if [ "$HEADLESS" = "true" ]; then
    echo -e "   ${GREEN}-> Headless${NC}"
  else
    echo -e "   ${GREEN}-> Headed${NC}"
  fi
  echo ""
fi

# ============================================
# VALIDATION
# ============================================
if [ -z "$ENV" ]; then
  echo -e "${RED}Error: --env is required${NC}"
  echo "Use --help for usage info"
  exit 1
fi

if [ -z "$REGIONS" ]; then
  echo -e "${RED}Error: --region is required${NC}"
  echo "Use --help for usage info"
  exit 1
fi

if [ -z "$TAG" ] && [ -z "$FEATURE" ]; then
  echo -e "${RED}Error: --tag or --feature is required${NC}"
  echo "Use --help for usage info"
  exit 1
fi

ENV_FILE=$(get_env_file "$ENV")
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}Error: Env file '$ENV_FILE' not found${NC}"
  exit 1
fi

# ============================================
# BUILD COMMAND
# ============================================
build_cmd() {
  local region="$1"
  local cmd="npx dotenv -e $ENV_FILE -- cross-env REGION=$region"

  if [ "$HEADLESS" = "true" ]; then
    cmd="$cmd HEADLESS=true"
  fi

  cmd="$cmd NODE_OPTIONS='--loader ts-node/esm' cucumber-js"

  if [ -n "$FEATURE" ]; then
    cmd="$cmd '$FEATURE'"
  else
    cmd="$cmd 'src/features/**/*.feature'"
  fi

  cmd="$cmd --import 'src/**/*.ts'"

  if [ -n "$TAG" ]; then
    cmd="$cmd --tags '$TAG'"
  fi

  echo "$cmd"
}

# ============================================
# CONFIRMATION
# ============================================
echo ""
echo -e "${BOLD}${CYAN}========================================${NC}"
echo -e "${BOLD}${CYAN}   Run Configuration${NC}"
echo -e "${BOLD}${CYAN}========================================${NC}"
echo -e "   Environment : ${BOLD}$(get_env_display $ENV)${NC} ($ENV_FILE)"
echo -e "   Region(s)   : ${BOLD}$REGIONS${NC}"
if [ -n "$TAG" ]; then
  echo -e "   Tag         : ${BOLD}$TAG${NC}"
else
  echo -e "   Feature     : ${BOLD}$FEATURE${NC}"
fi
echo -e "   Loop        : ${BOLD}${LOOP}x${NC}"
echo -e "   Browser     : ${BOLD}$([ "$HEADLESS" = "true" ] && echo "Headless" || echo "Headed")${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Show command preview
IFS=',' read -ra REGION_LIST <<< "$REGIONS"
for region in "${REGION_LIST[@]}"; do
  echo -e "${DIM}Command ($region): $(build_cmd $region)${NC}"
done
echo ""

# ============================================
# EXECUTE
# ============================================
TOTAL_PASS=0
TOTAL_FAIL=0
RESULTS=()

for region in "${REGION_LIST[@]}"; do
  region=$(echo "$region" | xargs) # trim whitespace
  REGION_PASS=0
  REGION_FAIL=0
  CMD=$(build_cmd "$region")

  echo -e "${BOLD}${BLUE}>>> Region: $(echo "$region" | tr '[:lower:]' '[:upper:]') ${NC}"
  echo -e "${BLUE}$(printf '=%.0s' {1..40})${NC}"

  for i in $(seq 1 $LOOP); do
    echo ""
    echo -e "${CYAN}--- $(echo "$region" | tr '[:lower:]' '[:upper:]') | Run $i/$LOOP ---${NC}"
    START_TIME=$(date +%s)

    if eval "$CMD" 2>&1; then
      END_TIME=$(date +%s)
      DURATION=$((END_TIME - START_TIME))
      echo -e "${GREEN}PASSED${NC} (${DURATION}s)"
      REGION_PASS=$((REGION_PASS + 1))
      TOTAL_PASS=$((TOTAL_PASS + 1))
      RESULTS+=("$(echo "$region" | tr '[:lower:]' '[:upper:]') Run $i: PASSED (${DURATION}s)")
    else
      END_TIME=$(date +%s)
      DURATION=$((END_TIME - START_TIME))
      echo -e "${RED}FAILED${NC} (${DURATION}s)"
      REGION_FAIL=$((REGION_FAIL + 1))
      TOTAL_FAIL=$((TOTAL_FAIL + 1))
      RESULTS+=("$(echo "$region" | tr '[:lower:]' '[:upper:]') Run $i: FAILED (${DURATION}s)")
    fi
  done

  echo ""
  echo -e "${BLUE}$(echo "$region" | tr '[:lower:]' '[:upper:]') Summary: ${GREEN}${REGION_PASS} passed${NC} / ${RED}${REGION_FAIL} failed${NC} out of ${LOOP}"
  echo ""
done

# ============================================
# FINAL SUMMARY
# ============================================
TOTAL=$((TOTAL_PASS + TOTAL_FAIL))
echo ""
echo -e "${BOLD}${CYAN}========================================${NC}"
echo -e "${BOLD}${CYAN}   Final Summary${NC}"
echo -e "${BOLD}${CYAN}========================================${NC}"
for result in "${RESULTS[@]}"; do
  if [[ "$result" == *"PASSED"* ]]; then
    echo -e "   ${GREEN}$result${NC}"
  else
    echo -e "   ${RED}$result${NC}"
  fi
done
echo -e "${CYAN}----------------------------------------${NC}"
echo -e "   Total : ${BOLD}$TOTAL${NC} runs"
echo -e "   Pass  : ${GREEN}${BOLD}$TOTAL_PASS${NC}"
echo -e "   Fail  : ${RED}${BOLD}$TOTAL_FAIL${NC}"

if [ $TOTAL_FAIL -eq 0 ]; then
  echo -e "   Rate  : ${GREEN}${BOLD}100%${NC}"
else
  RATE=$((TOTAL_PASS * 100 / TOTAL))
  echo -e "   Rate  : ${YELLOW}${BOLD}${RATE}%${NC}"
fi
echo -e "${CYAN}========================================${NC}"
echo ""
