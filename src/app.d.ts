// See https://svelte.dev/docs/kit/types#app.d.ts
import type { User, Session } from '$lib/server/db/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
			session: Session | null;
		}
		interface PageData {
			user?: User | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
