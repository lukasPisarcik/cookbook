import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()],
	server: {
		// Allow tunnels (ngrok, cloudflare, etc.) for webhook testing
		allowedHosts: true
	}
});
