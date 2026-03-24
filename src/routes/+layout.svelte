<script lang="ts">
	import './app.css'

	let { children } = $props()
</script>

<div class="max-w-md mx-auto p-4">
	{@render children()}
</div>
