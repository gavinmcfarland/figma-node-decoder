<script>
	export let platform
	export let checked
	export let id

	function togglePlatform(currentPlatform, newPlatform = "") {
		
		if (!newPlatform) {
			if (currentPlatform === "widget") {
				newPlatform = "plugin"
			}
			if (currentPlatform === "plugin") {
				newPlatform = "widget"
			}
		}
		else {
			if (newPlatform === "widget") {
				// checked = false
			}
			if (newPlatform === "plugin") {
				// checked = true
			}
		}
		
		if (currentPlatform !== newPlatform) {
			parent.postMessage(
				{
					pluginMessage: {
						type: "set-platform",
						platform: newPlatform
					},
				},
				"*"
			);
		}
		
	}
</script>

<div class="wrapper"><span class="plugin" on:click={() => {togglePlatform(platform, "plugin")}} style={checked ? "font-weight: bold; color: rgba(0, 0, 0, 0.8);" : ""}><span>Plugin</span></span>
	
	<span class="toggle">
	<label on:click={() => {togglePlatform(platform)}} for={id}> <input
	{id}
	type="checkbox"
	bind:checked={checked} /></label>
	</span>

	<span class="widget" on:click={() => {togglePlatform(platform, "widget")}} style={!checked ? "font-weight: bold; color: rgba(0, 0, 0, 0.8);" : ""}><span>Widget</span></span></div>

<!-- <a href="#" on:click={() => {togglePlatform(data.platform)}}>Plugin / Widget</a> -->

<style>
	.wrapper {
		min-height: 30px;
		display: flex;
		place-items: center;
		margin-inline: auto;
		min-width: 120px;
		width: 160px;
		justify-content: space-around;
		align-items: stretch;
	}

	.plugin, .widget {
		flex-grow: 1;
		width: 34px;
		display: flex;
		place-items: center;
		justify-content: center;
		cursor: default;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.3);
	}

	.plugin:hover, .widget:hover {
		color: rgba(0, 0, 0, 0.8) !important;
	}
	.plugin > span {
		/* margin-top: 1px; */
	}

	.toggle {
		
	}
	.toggle label {
		display: block;
		padding: 6px 8px;
	}

	.toggle input {
		appearance: none;
		display: inline-block;
		background: var(--black);
		border-radius: 999px;
		width: 24px;
		height: 12px;
		padding: 1px;
	}

	.toggle input::before {
		content: "";
		height: 100%;
		display: block;
		width: 100%;
		background-repeat: no-repeat;
		background-position: center;

		border-radius: 999px;
		display: block;
		height: 10px;
		width: 10px;
		background-color: white;
		margin-left: auto;
	}

	/* .toggle input:checked + label {
		background-color: blue;
	} */

	.toggle input:checked::before {
		margin-left: unset;
	}
</style>
