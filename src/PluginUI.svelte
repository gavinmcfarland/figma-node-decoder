<script>
	import { github } from "svelte-highlight/styles";
	import { addLanguage, highlight } from "illuminate-js";
	import { javascript } from "illuminate-js/lib/languages";
	import "./syntax-theme.css";
	import Toggle from "./Toggle.svelte";

	function copyToClipboard(textToCopy) {
		// navigator clipboard api needs a secure context (https)
		if (navigator.clipboard && window.isSecureContext) {
			// navigator clipboard api method'
			return navigator.clipboard.writeText(textToCopy);
		} else {
			// text area method
			let textArea = document.createElement("textarea");
			textArea.value = textToCopy;
			// make the textarea out of viewport
			textArea.style.position = "fixed";
			textArea.style.left = "-999999px";
			textArea.style.top = "-999999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			return new Promise((res, rej) => {
				// here the magic happens
				document.execCommand("copy") ? res() : rej();
				textArea.remove();
			});
		}
	}

	function copy() {
		/* Get the text field */
		var copyText = document.getElementById("codeBlock");

		copyToClipboard(copyText.innerText)
			.then(() => console.log("text copied !"))
			.catch(() => console.log("error"));

		parent.postMessage(
			{
				pluginMessage: {
					type: "code-copied",
				},
			},
			"*"
		);
	}

	function togglePlatform(currentPlatform) {
		var platform;
		if (currentPlatform === "widget") {
			platform = "plugin"
		}
		if (currentPlatform === "plugin") {
			platform = "widget"
		}

		console.log("New platform", platform)
		parent.postMessage(
			{
				pluginMessage: {
					type: "set-platform",
					platform
				},
			},
			"*"
		);
	}

	let promise = new Promise(() => {});
	addLanguage("js", javascript);

	let platformState;

	async function onLoad(event) {
		const data = await event.data.pluginMessage;
		var code;

		if (data.type === "string-received") {
			code = data.value;
		}

		parent.postMessage(
			{
				pluginMessage: {
					type: "code-rendered",
				},
			},
			"*"
		);

		if (data.platform === "widget") {
			platformState = false
		}

		if (data.platform === "plugin") {
			platformState = true
		}

		if (data) {
			return data;
		} else {
			throw new Error(data);
		}
	}
	

	

	window.onmessage = async (event) => {
		promise = onLoad(event);
	};
</script>

<svelte:window />

<svelte:head>
	{@html github}
</svelte:head>

<div class="actionbar">
	{#await promise}
		<p></p>
	{:then data}
	<Toggle id="platform" bind:checked={platformState} platform={data.platform}></Toggle>
		<!-- <p><span>Plugin</span><a href="#" on:click={() => {togglePlatform(data.platform)}}>Plugin / Widget</a><span>Widget</span></p> -->
	{/await}
</div>
<div class="wrapper">
	<div class="inner-wrapper">
		<div class="code">
			{#await promise}
				<p>Formatting code...</p>
			{:then data}
				<pre
					id="codeBlock">
				{#each data.value as item}
					{@html highlight(item, "js")}
				{/each}
				</pre>
			{:catch error}
				<p style="color: red">{error.message}</p>
			{/await}
		</div>

		<div
			class="toolbar"
			style="user-select: none;
		justify-content: flex-end"
		>
			<div class="button" style="min-width: 56px;" on:click={copy}>
				Copy
			</div>
		</div>
	</div>
</div>

<style>
	:root {
		--white: #fff;
		--grey: #e5e5e5;
		--black: #333;
		--blue: #18a0fb;
	}
	:global(*) {
		box-sizing: border-box;
	}
	:global(html) {
		height: calc(100% - 1px);
		overflow: hidden;
		position: relative;
	}
	:global(body) {
		padding: 0;
		margin: 0;
		font-family: sans-serif;
		font-size: 11px;
		color: var(--black);
		/* height: 100%; */
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		overflow: hidden;
		box-shadow: 0 0px 14px rgba(0, 0, 0, 0.15),
			0 0 0 0.5px rgba(0, 0, 0, 0.1);
		border-bottom-left-radius: 2px;
		border-bottom-right-radius: 2px;
	}
	.wrapper {
		padding: 16px;
		height: 100%;
		overflow: scroll;
		cursor: text;
	}
	.code {
		padding-bottom: calc(32px + 16px);
	}
	pre {
		margin: 0;
		font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
		tab-size: 4;
		/* white-space: break-spaces; */
		/* display: table; To get rid of end of line white space */
	}

	.actionbar {
		border-bottom: 1px solid var(--grey);
		padding: 8px;
		/* margin: 0 -16px; */
		/* left: 0;
		right: 0;
		position: absolute;
		bottom: 0px; */
		/* width: 100%; */
		background-color: var(--white);
		display: flex;
		/* border-bottom-left-radius: 2px;
		border-bottom-right-radius: 2px; */
		/* pointer-events: none; */
	}


	.toolbar {
		border-top: 1px solid var(--grey);
		padding: 8px;
		/* margin: 0 -16px; */
		left: 0;
		right: 0;
		position: absolute;
		bottom: 0px;
		/* width: 100%; */
		background-color: var(--white);
		display: flex;
		border-bottom-left-radius: 2px;
		border-bottom-right-radius: 2px;
		pointer-events: none;
	}
	.toolbar > * {
		pointer-events: all;
	}
	.button {
		/* border: 1px solid var(--black); */
		border-radius: 6px;
		padding-left: 8px;
		padding-right: 8px;
		display: inline-block;
		line-height: 32px;
		text-align: center;
		font-weight: 600;
		color: var(--blue);
	}
	.button:hover {
		/* background-color: var(--grey); */
		cursor: pointer;
	}

	.button:active {
	}
</style>
