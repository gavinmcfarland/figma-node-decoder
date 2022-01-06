<script>
	import { github } from "svelte-highlight/styles";
	import { addLanguage, highlight } from "illuminate-js";
	import { javascript } from "illuminate-js/lib/languages";
	import "./syntax-theme.css";
	import Toggle from "./Toggle.svelte";



	// const corner = document.getElementById('corner');

	function resize(node, event) {



		function resizeWindow(event) {
			const size = {
			width: Math.max(50,Math.floor(event.clientX+5)),
			height: Math.max(50,Math.floor(event.clientY+5))
			};
			parent.postMessage( { pluginMessage: { type: 'resize', size: size }}, '*');
		}

		node.onpointerdown = (e)=>{
			corner.onpointermove = resizeWindow;
			corner.setPointerCapture(e.pointerId);
		};

		node.onpointerup = (e)=>{
			corner.onpointermove = null;
			corner.releasePointerCapture(e.pointerId);
		};



		// corner.onpointerdown = (e)=>{
		// 	corner.onpointermove = resizeWindow;
		// 	corner.setPointerCapture(e.pointerId);
		// };
		// corner.onpointerup = (e)=>{
		// 	corner.onpointermove = null;
		// 	corner.releasePointerCapture(e.pointerId);
		// };
	}







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

	function runCode() {

		parent.postMessage(
			{
				pluginMessage: {
					type: "run-code",
				},
			},
			"*"
		);
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

<div class="toolbar">
	<div style="flex-grow: 1">
	{#await promise}
		<p></p>
	{:then data}
	<Toggle id="platform" bind:checked={platformState} platform={data.platform}></Toggle>
	{/await}
	</div>
	<div class="button icon-button" style="flex-grow: 0" on:click={runCode}>
		<span><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M10.9998 8L4.99976 4V12L10.9998 8Z" fill="black" fill-opacity="0.8"/>
			</svg></span>
	</div>
</div>

<div class="wrapper">
	<div class="inner-wrapper">
		<div class="code">
			{#await promise}
				<p>Formatting code...</p>
			{:then data}
				<pre
					id="codeBlock">
					{@html highlight(data.value, "js")}
				<!-- {#each data.value as item}
					{@html highlight(item, "js")}
				{/each} -->
				</pre>
			{:catch error}
				<p style="color: red">{error.message}</p>
			{/await}
		</div>

		<!-- <div
			class="toolbar"
			style="user-select: none;
		justify-content: flex-end"
		>

		</div> -->
	</div>
	<!-- <svg id="corner" use:resize width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.6465 7.64648L7.64648 19.6465L8.35359 20.3536L20.3536 8.35359L19.6465 7.64648ZM19.6465 12.6465L12.6465 19.6465L13.3536 20.3536L20.3536 13.3536L19.6465 12.6465ZM19.6465 17.6465L17.6465 19.6465L18.3536 20.3536L20.3536 18.3536L19.6465 17.6465Z" fill="black" fill-opacity="0.3"/> -->



</div>

<div class="actionbar">
	<div class="button" style="min-width: 64px; margin-left: auto" on:click={copy}>
		<span>Copy</span>
	</div>
</div>

<svg id="corner" use:resize width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13 2L2 13" stroke="black" stroke-opacity="0.24" stroke-linecap="round"/>
<path d="M13 6.5L6.5 13" stroke="black" stroke-opacity="0.24" stroke-linecap="round"/>
<path d="M13 11L11 13" stroke="black" stroke-opacity="0.24" stroke-linecap="round"/>
</svg>

<style>
	:root {
		--white: #fff;
		--grey: #e5e5e5;
		--black: #333;
		--blue: #18a0fb;
		--color-black-10: rgba(0, 0, 0, 0.1);
		--color-black-hover: rgba(0, 0, 0, 0.06);
	}

	:global(body) {
		display: flex;
		flex-direction: column;
	}

	#corner{
		/* display: none; */
		position: absolute;
		right: 0px;
		bottom: 0px;
		cursor: nwse-resize;
		/* background-color: pink; */
	}

	:global(body):hover #corner {
		display: block;
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
		font-family: Inter, sans-serif;
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

	.inner-wrapper {
		padding-right: 16px;
		width: fit-content;
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
		border-top: 1px solid var(--grey);
		padding: 8px 8px;
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
		user-select: none;
		justify-content: space-between;
	}


	.toolbar {
		border-bottom: 1px solid var(--grey);
		padding: 8px;
		/* margin: 0 -16px; */
		/* width: 100%; */
		background-color: var(--white);
		display: flex;
		user-select: none;
	}
	.toolbar > * {
		pointer-events: all;
	}
	.button {
		/* border: 1px solid var(--black); */
		border-radius: 6px;
		padding-left: 8px;
		padding-right: 8px;
		display: flex;
		height: 32px;
		text-align: center;
		font-weight: 600;
		color: var(--blue);
		align-items: center;
		justify-content: center;
	}
	.button:hover {
		background-color: #EDF5FA;
		cursor: pointer;
	}

	.icon-button {
		border-radius: 2px;
	}
	.icon-button:hover {
		background-color: var(--color-black-hover);
		cursor: default;
	}

	.button:active {
	}
</style>
