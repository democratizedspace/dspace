<script>
    import { onMount } from 'svelte';
    import Web3 from 'web3';
    import { writable } from 'svelte/store';
    import Chip from './Chip.svelte';

    const signedIn = writable(false);
    const signedInConfirmed = writable(false);
    let ethAddress;

    onMount(() => {
        const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

        if (web3.currentProvider.isMetaMask !== true) {
            console.error("MetaMask is not available.");
        }

        ethAddress = localStorage.getItem('ethAddress');
        if (ethAddress) {
            signedIn.set(true);
            signedInConfirmed.set(true);
        } else {
            signedInConfirmed.set(true);
        }
    });

    function handleSignIn() {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' }).then(function (accounts) {
                ethAddress = accounts[0];
                localStorage.setItem('ethAddress', ethAddress);
                signedIn.set(true);

            }).catch(function (error) {
                console.error("Error signing in with MetaMask:", error);
            });
        } else {
            console.error("MetaMask is not available.");
        }
    }

    function handleSignOut() {
        localStorage.removeItem('ethAddress');
        signedIn.set(false);

    }
</script>

<div id="container">
    {#if $signedIn }
        <p>gm, {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}!</p>

        <div style="height: 100px;"></div>

        <Chip text="Sign out" onClick={handleSignOut} />

    {/if}

    {#if !$signedIn && $signedInConfirmed }
        <Chip text="Sign in with Ethereum" onClick={handleSignIn} />
    {/if}

</div>

<style>
    #container {
        background-color: #68d46d;
        border-radius: 10px;
        padding: 30px;
        color: black;
    }
</style>