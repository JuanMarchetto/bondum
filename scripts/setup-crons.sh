#!/bin/bash
# Sets up cron jobs for hackathon deadline monitoring
# Run once: bash scripts/setup-crons.sh
# Remove after hackathon: crontab -r  (or manually edit with crontab -e)

set -euo pipefail

SCRIPTS_DIR="/home/marche/bondum-mobile/scripts"

# Make all scripts executable
chmod +x "$SCRIPTS_DIR"/*.sh

# Create crontab entries
CRON_ENTRIES=$(cat <<'CRON'
# Bondum Hackathon Cron Jobs (March 7-9, 2026)
# Remove after hackathon with: crontab -r

# Healthcheck every 30 minutes (server endpoint verification)
*/30 * * * * /home/marche/bondum-mobile/scripts/healthcheck.sh >> /home/marche/bondum-mobile/scripts/healthcheck.log 2>&1

# Build check every 2 hours
0 */2 * * * /home/marche/bondum-mobile/scripts/build-check.sh >> /home/marche/bondum-mobile/scripts/build-check.log 2>&1

# Pre-submission audit at key times on March 9 (deadline day)
0 6,12,18 9 3 * /home/marche/bondum-mobile/scripts/pre-submission-audit.sh >> /home/marche/bondum-mobile/scripts/audit.log 2>&1
CRON
)

# Preserve existing crontab and add ours
(crontab -l 2>/dev/null || true; echo "$CRON_ENTRIES") | sort -u | crontab -

echo "Cron jobs installed:"
echo ""
crontab -l
echo ""
echo "Logs will be written to $SCRIPTS_DIR/*.log"
echo "To remove after hackathon: crontab -r"
