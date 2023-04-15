<script>
    // TODO: port this to the backend instead of requiring user-provided keys
    
    import Chip from './Chip.svelte';
  
    const address = 'INSERT_ADDRESS_HERE';
    let responseMessage = '';
    let processing = false; // To indicate whether an operation is in progress
    const APIKEY = 'INSERT_API_KEY'; // Replace with your Gitcoin API Key
    const SUBMIT_PASSPORT_URI = 'https://api.scorer.gitcoin.co/registry/submit-passport';
    const GET_SCORE_URI = 'https://api.scorer.gitcoin.co/registry/score/182'; // Replace 182 with your scorer_id
  
    const handleSubmitPassport = async () => {
      responseMessage = '';
      processing = true;
      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': APIKEY,
      };
      const payload = {
        address,
        scorer_id: "182" // Replace with your scorer_id
        // Additional data such as signature and nonce may be required
      };
      try {
        const response = await fetch(SUBMIT_PASSPORT_URI, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        const responseData = await response.json();
        if (responseData.status === 'PROCESSING') {
          checkScoreStatus();
        } else {
          responseMessage = JSON.stringify(responseData, null, 2);
          processing = false;
        }
      } catch (err) {
        responseMessage = 'Error submitting passport: ' + err.message;
        processing = false;
      }
    };
  
    const checkScoreStatus = async () => {
      try {
        const response = await fetch(`${GET_SCORE_URI}/${address}`, {
          headers: { 'X-API-Key': APIKEY },
        });
        const responseData = await response.json();
        if (responseData.status === 'DONE') {
          responseMessage = responseData.score;
          processing = false;
        } else {
          setTimeout(checkScoreStatus, 1000); // Retry after 1 second
        }
      } catch (err) {
        responseMessage = 'Error checking score status: ' + err.message;
        processing = false;
      }
    };
  </script>
  
  <div>
    <h4>Gitcoin Passport</h4>
    <p>A score of 20 or more (based on ETH address you connected) strongly indicates that you're a human (for now).</p>
    <Chip text="Get Gitcoin Passport score" onClick={handleSubmitPassport} disabled={processing} />
    <pre>Score: {responseMessage}</pre>
  </div>
  