<script>
    import { onMount } from 'svelte';
    import Web3 from 'web3';
    import { writable } from 'svelte/store';
    import Chip from './Chip.svelte';

    const signedIn = writable(false);
    const signedInConfirmed = writable(false);
    let ethAddress, gm = false;

    onMount(() => {
        console.log('mounted');
        const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");

        if (web3.currentProvider.isMetaMask === true) {
            console.log("MetaMask is available.");
        } else {
            console.error("MetaMask is not available.");
        }

        ethAddress = localStorage.getItem('ethAddress');
        console.log("ethAddress:", ethAddress);
        if (ethAddress) {
            console.log("Found ethAddress in localStorage:", ethAddress);
            signedIn.set(true);
            signedInConfirmed.set(true);
        } else {
            console.log("No ethAddress in localStorage.");
            signedInConfirmed.set(true);
        }
    });

    function handleSignIn() {
        console.log('clicked');

        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' }).then(function (accounts) {
                ethAddress = accounts[0];
                localStorage.setItem('ethAddress', ethAddress);
                console.log("Signed in with account:", ethAddress);
                signedIn.set(true);

            }).catch(function (error) {
                console.error("Error signing in with MetaMask:", error);
            });
        } else {
            console.error("MetaMask is not available.");
        }
    }

    function handleSignOut() {
        console.log('clicked');
        localStorage.removeItem('ethAddress');
        signedIn.set(false);

    }
</script>

<div id="container">
    {#if $signedIn }
        <p>gm, {ethAddress.slice(0, 6)}...{ethAddress.slice(-4)}!</p>
        
        <Chip text="say gm" href="/gm" />
        <Chip text="choose NFT as avatar" href="/profile/avatar/nft" />
        <Chip text="change your username" href="/profile/username/edit" />

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