#!/bin/bash
# Create all essential files from restoration content

# Tests (stub for now)
touch tests/{canonical,intent,signals,prepare,act,redact,reviewer,scenarios,render}.test.{ts,tsx}

# UI components
touch src/ui/{world,useClock,App}.ts{,x}
touch src/ui/components/{Stage,DetailPanel,Controls,Summary}.tsx
touch src/ui/styles/{tokens,app}.css

# Node CLI
touch src/node/{fileStore,qontoAdapter,cli}.ts

# Fixtures  
touch src/fixtures/{scenarios,types}.ts

echo "Directory structure created"
