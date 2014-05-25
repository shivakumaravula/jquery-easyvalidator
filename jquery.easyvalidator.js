// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

		// undefined is used here as the undefined global variable in ECMAScript 3 is
		// mutable (ie. it can be changed by someone else). undefined isn't really being
		// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		// can no longer be modified.

		// window and document are passed through as local variable rather than global
		// as this (slightly) quickens the resolution process and can be more efficiently
		// minified (especially when both are regularly referenced in your plugin).

		// Create the defaults once
		var pluginName = "easyvalidator",
			defaults = {
				ui: "bootstrap",
				//this.form	= form;	// Contains the id of the invoked form
				//this.elements	: "input:text:visible, input:password:visible, input:radio, input:checkbox, select, textarea"; // Form elements to validate
				formElements	: "input, select, textarea", // Form elements to validate
				attributes	: [ 'required', 'digits', 'number', 'minlength', 'maxlength', 'min', 'max', 'email', 'url', 'date' ] // Available validation properties that can be set on form elements
		};

		// The actual plugin constructor
		function Plugin ( element, options ) {
				this.element = element;

				// jQuery has an extend method which merges the contents of two or
				// more objects, storing the result in the first object. The first object
				// is generally empty as we don't want to alter the default options for
				// future instances of the plugin
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;

				this.temp	 = false,// Stores the password to match with verify password
				this.change	 = 0,	// Flag for changes
				this.error	 = 0,	// Flag for errors
				this.errors	 = [],	// Array of errors
				this.firstEl = false,// Stores the first error element, to focus after validation

				this.init();
		}

		Plugin.prototype = {
				init: function () {
						// Place initialization logic here
						// You already have access to the DOM element and
						// the options via the instance, e.g. this.element
						// and this.settings
						// you can add more functions like the one below and
						// call them like so: this.yourOtherFunction(this.element, this.settings).
						console.log("xD");
						console.log(this.element);
						console.log("Callback : " + this.settings.callback);

						var obj = this;

						$(this.element).on('submit', function(){
							obj.validate();
						});
				},
				validate: function () {

						var form = this.element;
						var obj = this;

						// Remove all previously set errors
						$(form).find('.alert.alert-danger').remove();
						$(form).find('.form-group').removeClass('has-error').find('small.text-danger').remove();
						
						// Block of major validations
						$(form).find(this.settings.formElements).each(function(){	// For each field in the form perform checks
							
							// Check if data-validate is set on the field, if so validate the field
							if($(this).is('[data-validate]') && !$(this).is(':hidden')){
								obj.validateElement(this);
								console.log('Validate: ' + form);
							}
							
						});

						// If no errors return true, else return false
						if(!this.errors.length){
							//return true;
							console.log('No errors found');
						}
						else{
							// Render the errors after all fields are validated
							this.renderErrors();
							//return false;
							console.log('Errors found. Rendering!');
							console.log(this.errors);

							return false;
						}
				},

				validateElement: function(element){
					el		= $(element);
					value	= el.val();
					length	= value.length;
					preText	= 'This field';
					
					// Break the rules string into an ruleset array
					ruleSet = el.attr('data-validate').split('|');
					
					// Loop through the array and validate for every rule
					for (index in ruleSet) {
						var rule = ruleSet[index];
						var ruleKey = false;	// Name of the rule
						var ruleVal = false;	// Value for the rule, some items like minlength use this
						
						// Check if any key:vale rule exist, if so break them
						if (rule.indexOf(':')) {
							rule = rule.split(':');
							ruleKey = rule[0];
							ruleVal = rule[1];
						}
						else {
							ruleKey = rule;
						}
						
						//alert(JSON.stringify(ruleKey, undefined, true));
						
						// Check if rule is empty
						if (!ruleKey) {
							return;
						}
						
						// Check if length is more than zero else skip validators, no need to validate empty data
						if (ruleKey != 'required' && value.length == 0) {
							return; // No need to validate non required empty values
						}
						
						/*** Check for required key, a small fix for lazy errors where native errors will be overrided by custom ones ***/
						// Say, if native minlength & required are given, for empty values the error shows minlength but not required
						if (ruleKey == 'required') {
							if (!value) {
								this.setError(el, preText + ' is required');
								return;
							}
							//return;
						}
						
						/*** Check if any native html properties are set, if so validate them ***/
						// Native html 'minlength' property
						if (el.is('[minlength]')) {
							minLength = el.attr('minlength');
							if (length < minLength){
								this.setError(el, preText + ' must be at least ' + minLength + ' characters');
								return;
							}
						}
						
						// Native html 'maxlength' property
						if (el.is('[maxlength]')) {
							maxLength = el.attr('maxlength');
							if (length > maxLength){
								this.setError(el, preText + ' must be less than ' + maxLength + ' characters');
								return;
							}
						}
						
						/*** Check for the custom rules defined by plugin ***/
						switch(ruleKey){
							
							// Required
							/*case 'required':
								if(!value){
									this.setError(el, preText + ' is required');
									return;
								}
								break;*/
							
							// Min Length
							case 'minLength':
								if (length < ruleVal) {
									this.setError(el, preText + ' must be at least ' + ruleVal + ' characters');
									return;
								}
								break;
							
							// Max Length
							case 'maxLength':
								if (length > ruleVal) {
									this.setError(el, preText + ' must be less than ' + ruleVal + ' characters');
									return;
								}
								break;
							
							// Length - Must be equal to specified length
							case 'length':
								if (length != ruleVal) {
									this.setError(el, preText + ' must be ' + length + ' numbers');
									return;
								}
								break;
							
							// Min
							case 'min':
								if (value < min) {
									this.setError(el, preText + ' must be more than ' + min);
									return;
								}
								break;
							
							// Max
							case 'max':
								if (value > max) {
									this.setError(el, preText + ' must be less than ' + max);
									return;
								}
								break;
							
							// Email ID
							case 'emailID':
								if (! checkEmailID(value)) {
									this.setError(el, 'Email address is invalid');
									return;
								}
								break;
							
							// NPI number
							case 'npiNo':
								if(! checkNPINo(value)){
									this.setError(el, preText + ' is invalid');
									return;
								}
								break;

							// Routing number
							case 'routingNo':
								if(! checkRoutingNo(value)){
									this.setError(el, preText + ' is invalid');
									return;
								}
								break;
							
							// Phone number
							case 'phoneNo':
								/*
								Land lines and cell phones use the same format: 
								(area code)prefix-suffix ten digits 
								The difference is if you're calling from outside the country. Use a 1 before the area code, and use 00 or 0011 for the country code. 
								Here's a great website: 
								http://www.countrycodes.com/
								*/
								//if(value.length !== 10+4){	// 10 is actual numbers, 4 are the number format characters
								
								// Regex:		/^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/
								// Matches:		(111) 222-3333 | 1112223333 | 111-222-3333
								// Non-Matches:	11122223333 | 11112223333 | 11122233333
								// Source: 		http://regexlib.com/REDetails.aspx?regexp_id=45
								if(! value.match(/^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/)){
									this.setError(el, preText + " is invalid");
									return;
								}
								break;
							
							// US Zip
							case 'zipUS':
								if(! /^\d{5}(-\d{4})?$/.test(value)){
									this.setError(el, preText + " is invalid");
									return;
								}
								break;
							
							// CVV
							case 'cvv':
								if(! /^[0-9]{3,4}$/.test(value)){
									this.setError(el, preText + " is invalid");
									return;
								}
								break;
							
							// URL
							case 'url':
								// jquery validation regex - This is an overkill, so better avoid
								// if(/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value))
								if(! value.match(/^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/)){
									this.setError(el, preText + " is invalid");
									return;
								}
								break;
							
							// Notzero
							case 'notZero':
								if(value == 0){
									this.setError(el, preText + " is required");
									return;
								}
								break;
							
							case 'notEquals':
								if(value == ruleVal){
									//this.setError(el, preText + " doesn't match with " + ruleVal.capitalize());
									this.setError(el, "Please give a different value than current");
									return;
								}
								break;
							
							// Matches - Match with another element of the same form
							case 'matches':
								this.temp = $('input[name='+ ruleVal + ']').val();
								if(value !== this.temp){
									this.setError(el, preText + " doesn't match with " + ruleVal.capitalize());
									return;
								}
								break;
							
							// No Match - Check no Match with another element of the same form, set error if match
							case 'noMatch':
								this.temp = $('input[name='+ ruleVal + ']').val();
								if(value == this.temp){
									this.setError(el, preText + " must not match with " + ruleVal.capitalize());
									return;
								}
								break;
							
							// Integer - Check if the value is a valid integer
							case 'integer':
								if(isNaN(value)) {
									this.setError(el, preText + " is invalid");
									return;
								}
								break;
							
							// Currency - Check if the value is a valid currency format
							case 'currency':
								if(! value.match(/^[1-9]\d*(((,\d{3}){1})?(\.\d{0,2})?)$/)){
									this.setError(el, preText + " is invalid");
									return;
								}
								break;
							
							default:
								// Fix for html pre defined rules as we support validation for them too, a small glitch to fix
								if (ruleKey != 'required' && ruleKey != 'minlength' && ruleKey != 'maxlength') {
									console.log('Specified rule ['+ ruleKey +'] is not supported by the plugin. Contact us for further support');
								}		
						}
					}
				},

				// Set Error Function
				setError : function(el, error){

					this.errors.push(error);
					el.addClass('field-error');
					if(!this.firstEl){
						this.firstEl = el;
					}
					
					// Check if wrapper already has a error, if so return (One error per cotrol set)
					//if(el.parent().find('small.text-error.validator-error').length) return;
					
					// Attach an error to the element
					el.closest('.form-group').addClass('has-error').append("<small class='text-danger'>" + error + "</small>");
					el.on('keyup.errorEvent change.errorEvent', function(){
						$(this).closest('.form-group').removeClass('has-error').find('small.text-danger').remove();
						$(this).unbind('keyup.errorEvent change.errorEvent');
					});
					//el.one('keyup', function(){})  // Runs keyup just once and unbinds automatically

				},

				// Error Rendering function
				renderErrors : function(){

					$(this.element).find('fieldset .alert').remove();
					
					if(this.errors == '') return;
					
					// Displays the error callout message
					errorCallout = "<div class='alert alert-danger'><p>Please fix the errors to continue</p></div>";
					$(this.element).prepend(errorCallout);
					
					this.firstEl.focus();
					//scrollToTop(true);
					
				}
		};

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( options ) {
				this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
						}
				});

				// chain jQuery functions
				return this;
		};

	/*
	|--------------------------------------------------------------------------
	| Utility functions
	|--------------------------------------------------------------------------
	|
	| The functions that are used by the validator
	|
	*/
		
		function checkLuhnAlg(no) {

			// NPI Number - Using Luhn Algorithm
			// ***Luhn Algorithm***
			// 1.Take only the first 9 digits from the NPI to be validated
			// 2.Prefix 80840 to the number from step 1
			// 3.Double the value of alternate digits beginning with the rightmost digit.
			// 4.Add the individual digits of the products resulting from step 3 to the unaffected digits from the original number.
			// 5.Subtract the total obtained in step 4 from the next higher number ending in zero. This is the check digit. If the total obtained in step 4 is a number ending in zero, the check digit is zero.
			// 6.If the check digit is equal to the 10th digit in the NPI, then the given NPI is valid.
			
			if(no.length !== 10){
				return false;
			}
			else{
				noX = no.substring(0, 9); 		// Extract first 9 digits of npi number
				checkDigit = Number(no[9]); 	// Check digit will be the 10th digit of npi number
				noX = '80840' + noX;// Prefixing the 80840 (80 indicates health applications and 840 indicates the United States)
				sum = 0;
				
				for(i=13; i>=0; i--){
					if(i%2 === 0){
						sum += Number(noX[i]);
					}
					else{
						temp = Number(noX[i]) * 2;
						if(temp >= 10){
							sum += Number(Math.floor(temp/10));
							sum += Number(temp%10);
						}
						else{
							sum += Number(temp);
						}
					}
				}
				
				checkVerify = (Math.ceil(sum/10) * 10) - sum;
				
				if(checkDigit !== checkVerify){
					return false;
				}
				return true;
			}
		}
		
		function getCreditCardType(accountNumber) {
			// Default is 'unknown'
			var cardType = "unknown";
			
			if (/^5[1-5]/.test(accountNumber))					cardType = "mastercard";// Check for MasterCard
			else if (/^4/.test(accountNumber))					cardType = "visa";		// Check for Visa
			else if (/^3[47]/.test(accountNumber))				cardType = "amex";		// Check for AmEx
			else if (/^6011|65|64[4-9]/.test(accountNumber))	cardType = "discover";	// Check for Discover
			
			return cardType;
		}
		
		function checkEmailID(value) {
			var apos = value.indexOf("@");
			var dpos = value.lastIndexOf(".");
			if(apos < 1 || dpos < apos+2 || dpos+2 >= value.length){
				return false;
			}
			else{
				return true;
			}
		}
		
		function checkNPINo(value) {
			npi = new String(value);
			if(!checkLuhnAlg(npi)){
				return false;
			}
			else{
				return true;
			}
		}

		function checkRoutingNo(value) {
			// Run through each digit and calculate the total.

			n = 0;
			
			for (i = 0; i < value.length; i += 3) {
				n += parseInt(value.charAt(i),     10) * 3
				  +  parseInt(value.charAt(i + 1), 10) * 7
				  +  parseInt(value.charAt(i + 2), 10);
			}

			// If the resulting sum is an even multiple of ten (but not zero),
			// the aba routing number is good.

			if (n != 0 && n % 10 == 0)
				return true;
			else
				return false;

			// Source => http://www.brainjar.com/js/validation/
		}
		
	/*************URL Validation - based on rfc1738 and rfc3986 to check http and https urls***************/
	/*
		
		window.isValidURL = (function() {// wrapped in self calling function to prevent global pollution

	     //URL pattern based on rfc1738 and rfc3986
	    var rg_pctEncoded = "%[0-9a-fA-F]{2}";
	    var rg_protocol = "(http|https):\\/\\/";

	    var rg_userinfo = "([a-zA-Z0-9$\\-_.+!*'(),;:&=]|" + rg_pctEncoded + ")+" + "@";

	    var rg_decOctet = "(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])"; // 0-255
	    var rg_ipv4address = "(" + rg_decOctet + "(\\." + rg_decOctet + "){3}" + ")";
	    var rg_hostname = "([a-zA-Z0-9\\-\\u00C0-\\u017F]+\\.)+([a-zA-Z]{2,})";
	    var rg_port = "[0-9]+";

	    var rg_hostport = "(" + rg_ipv4address + "|localhost|" + rg_hostname + ")(:" + rg_port + ")?";

	    // chars sets
	    // safe           = "$" | "-" | "_" | "." | "+"
	    // extra          = "!" | "*" | "'" | "(" | ")" | ","
	    // hsegment       = *[ alpha | digit | safe | extra | ";" | ":" | "@" | "&" | "=" | escape ]
	    var rg_pchar = "a-zA-Z0-9$\\-_.+!*'(),;:@&=";
	    var rg_segment = "([" + rg_pchar + "]|" + rg_pctEncoded + ")*";

	    var rg_path = rg_segment + "(\\/" + rg_segment + ")*";
	    var rg_query = "\\?" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";
	    var rg_fragment = "\\#" + "([" + rg_pchar + "/?]|" + rg_pctEncoded + ")*";

	    var rgHttpUrl = new RegExp( 
	        "^"
	        + rg_protocol
	        + "(" + rg_userinfo + ")?"
	        + rg_hostport
	        + "(\\/"
	        + "(" + rg_path + ")?"
	        + "(" + rg_query + ")?"
	        + "(" + rg_fragment + ")?"
	        + ")?"
	        + "$"
	    );

	    // export public function
	    return function (url) {
	        if (rgHttpUrl.test(url)) {
	            return true;
	        } else {
	            return false;
	        }
	    };
	})();
		
		// One line regex
		// var rg = /^(http|https):\/\/(([a-zA-Z0-9$\-_.+!*'(),;:&=]|%[0-9a-fA-F]{2})+@)?(((25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])(\.(25[0-5]|2[0-4][0-9]|[0-1][0-9][0-9]|[1-9][0-9]|[0-9])){3})|localhost|([a-zA-Z0-9\-\u00C0-\u017F]+\.)+([a-zA-Z]{2,}))(:[0-9]+)?(\/(([a-zA-Z0-9$\-_.+!*'(),;:@&=]|%[0-9a-fA-F]{2})*(\/([a-zA-Z0-9$\-_.+!*'(),;:@&=]|%[0-9a-fA-F]{2})*)*)?(\?([a-zA-Z0-9$\-_.+!*'(),;:@&=\/?]|%[0-9a-fA-F]{2})*)?(\#([a-zA-Z0-9$\-_.+!*'(),;:@&=\/?]|%[0-9a-fA-F]{2})*)?)?$/;
		
	*/

	String.prototype.capitalize = function() {
	    return this.charAt(0).toUpperCase() + this.slice(1);
	}

	function inArray(needle, haystack) {
	    var length = haystack.length;
	    for(var i = 0; i < length; i++) {
	        if(haystack[i] == needle) return true;
	    }
	    return false;
	}

})( jQuery, window, document );
