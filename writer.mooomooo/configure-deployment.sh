#!/bin/bash

# Deployment configuration switcher

case "$1" in
  "local")
    echo "Switching to local development configuration..."
    echo "✅ Local config active. Use: docker-compose -f docker-compose.local.yml up"
    echo "📝 Caddy will generate self-signed certificates for localhost"
    echo "🌐 Access: https://localhost"
    ;;
    
  "aws")
    echo "Switching to AWS production configuration..."
    echo "✅ AWS config active. Use: docker-compose up"
    echo "📝 Make sure to:"
    echo "   1. Point writer.mooomooo.app DNS to your EC2 instance public IP"
    echo "   2. Ensure ports 80 and 443 are open in security group"
    echo "   3. Update environment variables for production"
    echo "🌐 Caddy will automatically get Let's Encrypt SSL certificate!"
    echo "🔒 SSL certificate will be stored in Docker volume 'caddy_data'"
    ;;
    
  *)
    echo "Usage: $0 {local|aws}"
    echo ""
    echo "  local  - Configure for local development with self-signed SSL"
    echo "  aws    - Configure for AWS deployment with Let's Encrypt SSL"
    exit 1
    ;;
esac
