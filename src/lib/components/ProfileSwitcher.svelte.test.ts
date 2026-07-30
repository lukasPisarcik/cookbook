import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ProfileSwitcher from './ProfileSwitcher.svelte';
import { profileStore } from '$lib/stores';

describe('ProfileSwitcher.svelte', () => {
	beforeEach(() => {
		localStorage.clear();
		profileStore.clear();
		profileStore.known = [];
	});

	it('renders the „Kto si?" prompt when there is no profile', async () => {
		const screen = render(ProfileSwitcher, { props: { variant: 'gate' as const } });
		expect(screen.container.textContent).toContain('Kto si?');
		expect(screen.container.querySelector('[data-testid="profile-name-input"]')).not.toBeNull();
	});

	it('adopts the submitted name', async () => {
		const screen = render(ProfileSwitcher, { props: { variant: 'gate' as const } });

		await screen.getByTestId('profile-name-input').fill('Lukáš');
		await screen.getByRole('button', { name: 'Pokračovať' }).click();

		expect(profileStore.userId).toBe('lukas');
		expect(profileStore.name).toBe('Lukáš');
	});

	it('keeps the submit button disabled for empty input', async () => {
		const screen = render(ProfileSwitcher, { props: { variant: 'gate' as const } });
		const submit = screen.getByRole('button', { name: 'Pokračovať' });

		await expect.element(submit).toBeDisabled();

		await screen.getByTestId('profile-name-input').fill('Zuzka');
		await expect.element(submit).toBeEnabled();
	});

	it('offers previously used profiles as buttons', async () => {
		profileStore.known = [
			{ userId: 'lukas', name: 'Lukáš' },
			{ userId: 'zuzka', name: 'Zuzka' }
		];

		const screen = render(ProfileSwitcher, { props: { variant: 'gate' as const } });

		await screen.getByRole('button', { name: 'Zuzka' }).click();
		expect(profileStore.userId).toBe('zuzka');
	});

	it('renders the initials avatar once a profile is active', async () => {
		profileStore.set('Lukáš');

		const screen = render(ProfileSwitcher, { props: { variant: 'switcher' as const } });
		const trigger = screen.container.querySelector('[data-testid="profile-switcher"]');

		expect(trigger).not.toBeNull();
		expect(trigger?.textContent?.trim()).toBe('L');
		// The gate is gone — no prompt while a profile is active.
		expect(screen.container.textContent).not.toContain('Kto si?');
	});

	it('renders nothing as a switcher while no profile is resolved', async () => {
		// The shell (and so the top bar) renders with no profile on error pages,
		// which deliberately skip the gate. The switcher must stay out of the way
		// there rather than expanding into a full-screen prompt inside the header.
		const screen = render(ProfileSwitcher, { props: { variant: 'switcher' as const } });

		expect(screen.container.textContent).not.toContain('Kto si?');
		expect(screen.container.querySelector('[data-testid="profile-name-input"]')).toBeNull();
		expect(screen.container.querySelector('[data-testid="profile-switcher"]')).toBeNull();
	});

	it('renders nothing as a gate once a profile is active', async () => {
		profileStore.set('Lukáš');

		const screen = render(ProfileSwitcher, { props: { variant: 'gate' as const } });

		expect(screen.container.textContent).not.toContain('Kto si?');
	});
});
