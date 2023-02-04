<script>
    import { onMount } from 'svelte';
    import Web3 from 'web3';
    import Chip from './Chip.svelte';

    onMount(
        () => {
            console.log('mounted');
            const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
 
            if (web3.currentProvider.isMetaMask === true) {
                console.log("MetaMask is available.");
            } else {
                console.error("MetaMask is not available.");
            }
        }
    )
    
    function handleClick() {
        console.log('clicked');
        
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_requestAccounts' }).then(function (accounts) {
                console.log("Signed in with account:", accounts[0]);

                // remove the element with id "signin"
                const signin = document.getElementById('signin');
                signin.remove();

                // add a p element to id "container" with the account address
                const container = document.getElementById('container');
                const p = document.createElement('p');
                p.innerText = `signed in with ${accounts[0]}`;
                container.appendChild(p);
            }).catch(function (error) {
                console.error("Error signing in with MetaMask:", error);
            });
        } else {
            console.error("MetaMask is not available.");
        }
    }
</script>

<div id="container">
    <span id="signin">
        <Chip text="Sign in with Ethereum" onClick={handleClick} />
    </span>
</div>

<style>
</style>