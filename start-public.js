const { spawn } = require('child_process');
const localtunnel = require('localtunnel');

let frontendTunnel = null;
let backendTunnel = null;

async function startTunnels() {
  console.log('🌐 Starting public tunnels...\n');

  try {
    // Wait a bit for servers to start
    console.log('⏳ Waiting for servers to start...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Start frontend tunnel (port 3000)
    console.log('🚀 Creating frontend tunnel (port 3000)...');
    frontendTunnel = await localtunnel({ port: 3000 });
    
    console.log('\n✅ ========================================');
    console.log('✅ YOUR PUBLIC URL (Share this!):');
    console.log(`✅ ${frontendTunnel.url}`);
    console.log('✅ ========================================\n');

    // Start backend tunnel (port 5001)
    console.log('🚀 Creating backend tunnel (port 5001)...');
    backendTunnel = await localtunnel({ port: 5001 });
    
    console.log('✅ Backend tunnel:', backendTunnel.url);
    console.log('\n📋 CONFIGURATION:');
    console.log(`Frontend: ${frontendTunnel.url}`);
    console.log(`Backend:  ${backendTunnel.url}`);
    console.log('\n⚠️  IMPORTANT: Set environment variable:');
    console.log(`export REACT_APP_API_URL=${backendTunnel.url}/api`);
    console.log('\n💡 Or restart the React app with:');
    console.log(`REACT_APP_API_URL=${backendTunnel.url}/api npm run client\n`);

    // Handle tunnel close
    frontendTunnel.on('close', () => {
      console.log('❌ Frontend tunnel closed');
    });

    backendTunnel.on('close', () => {
      console.log('❌ Backend tunnel closed');
    });

  } catch (error) {
    console.error('❌ Error creating tunnels:', error);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n🛑 Closing tunnels...');
  if (frontendTunnel) frontendTunnel.close();
  if (backendTunnel) backendTunnel.close();
  process.exit(0);
});

startTunnels();

