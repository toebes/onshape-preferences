<?php
require_once 'config.php';
$logfile = NULL;

// If they ask for a log file to be written, open it up
function openalog() {
  global $logfile, $logfilename, $enable_log;
  if ($enable_log) {
    $logfile = fopen($logfilename, "a");
  }
}

// Close out any open log file
function closealog() {
  global $logfile;
  if ($logfile) {
    fclose($logfile);
    $logfile = NULL;
  }
}

// Output a log message to the logfile (if it is open)
function oalog($logstr) {
  global $logfile;
  if ($logfile) {
    fwrite($logfile, $logstr);
  }
}

function getToken($code, $redirect_uri){
  // Configure the application for which we are asking
  global $token_url, $client_id, $client_secret;

  // Log the request so we know what was going on
  oalog("\n-------\nREQUEST for " . $code . "\n");
  oalog("\nREDIRECT_URI=".$redirect_uri."\n");

  // Generated by curl-to-PHP: http://incarnate.github.io/curl-to-php/
  $ch = curl_init();

  curl_setopt($ch, CURLOPT_URL, $token_url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  curl_setopt($ch, CURLOPT_POST, 1);
  curl_setopt($ch, CURLINFO_HEADER_OUT, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=authorization_code"
                                      ."&code=" . urlencode($code)
                                      ."&client_id=" . urlencode($client_id)
                                      ."&client_secret=" . urlencode($client_secret)
                                      ."&redirect_uri=" . urlencode($redirect_uri)
                                      );

  $headers = array();
  $headers[] = 'Content-Type: application/x-www-form-urlencoded';
  curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

  // Dump out the headers so we can confirm what we asked for
  $headers = curl_getinfo($curl, CURLINFO_HEADER_OUT);
  oalog("HEADERS:\n".$headers."\n");

  // Make the request
  $response = curl_exec($ch);
  $err = curl_error($ch);

  // Log what we got back
  oalog("RESPONSE:\n".$response."\nERR: ".$err."\n");

  // Log all the information about the request/response
  $info = curl_getinfo($ch);
  oalog("INFO:\n".print_r($info, TRUE));

  curl_close($ch);

  if ($err) {
    echo "cURL Error: " . $err;
    oalog("cURL Error\n");
    return;
  }
  // We got a response, so parse out the JSON
  $response = json_decode($response, true);
  oalog('JSON: '.print_r($response, true)."\n");

  // See if we got the access_token to return.
  if(array_key_exists("access_token", $response)) {
    oalog('SUCCESS:'.$response["access_token"]."\n");
    return $response;
  }

  // Look for a descriptive error
  if(array_key_exists("message", $response)) {
    $message = $response["message"];
    $status = $response["status"];
    oalog("FAILURE STATUS: ".$status.": ".$message."\n");
    return $response;
  }
  // Look for a descriptive error
  if(array_key_exists("error", $response)) {
    $message = $response["error"];
    $status = $response["error_description"];
    oalog("FAILURE STATUS: ".$status.": ".$message."\n");
    return $response;
  }
   oalog("Unknown Error\n");
  return "Unknown Error!";
}

// Open any log file if needed
openalog();

// Get the authorization code we are to exchange for an access token
$authorization_code = $_GET['code'];
$redirect_uri = $_GET['redirect_uri'];

// Of course make sure that they gave us one to request
if(!$authorization_code){
    die('something went wrong!');
}

$result = getToken($authorization_code, $redirect_uri);

// Close the log file
closealog();
echo json_encode($result);
?>