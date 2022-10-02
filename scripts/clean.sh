#!/bin/sh

# Clean up local fileserver storage
rm -rf fileserver/

# Clean up local shared storage
rm -rf .shared/
rm -rf .storage/

# Remove local database
rm database.db
