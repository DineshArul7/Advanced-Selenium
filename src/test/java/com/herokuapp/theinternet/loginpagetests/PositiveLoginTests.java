package com.herokuapp.theinternet.loginpagetests;

import org.openqa.selenium.Cookie;
import org.testng.Assert;
import org.testng.annotations.Test;

import com.herokuapp.theinternet.base.TestUtilities;
import com.herokuapp.theinternet.pages.LoginPage;
import com.herokuapp.theinternet.pages.SecureAreaPage;
import com.herokuapp.theinternet.pages.WelcomePage;

public class PositiveLoginTests extends TestUtilities {

	@Test
	public void logInTest() {
		log.info("Starting logIn test");

		// open main page
		WelcomePage wecompage = new WelcomePage(driver, log);
		wecompage.openPage();
		takeScreenshot("WelcomePage Opened ");

		// Click on Form Authentication link
		LoginPage loginpage = wecompage.clickFormAuthenticationLinkLocator();
		takeScreenshot("LoginPage Opened ");
		
		// Add new cookie
				Cookie ck = new Cookie("username", "tomsmith", "the-internet.herokuapp.com", "/", null);
				loginpage.setCookie(ck);
				
		// enter username and password
		SecureAreaPage secureareapage = loginpage.login("tomsmith", "SuperSecretPassword!");
		takeScreenshot("SecureAreaPage Opened ");
		
		// Get cookies
				String username = secureareapage.getCookie("username");
				log.info("Username cookie: " + username);
				String session = secureareapage.getCookie("rack.session");
				log.info("Session cookie: " + session);
				
		// sleep
		// sleep(3000);

		// WebDriverWait wait = new WebDriverWait(driver, 10);

		// push log in button
		// WebElement logInButton = driver.findElement(By.className("radius"));
		// wait.until(ExpectedConditions.elementToBeClickable(logInButton));
		// logInButton.click();

		// verifications
		// new url
		Assert.assertEquals(secureareapage.getCurrentUrl(), secureareapage.getPageUrl());

		// log out button is visible
		Assert.assertTrue(secureareapage.isLogOutVisible(), "logOutButton is not visible.");

		// Successful log in message
		String expectedSuccessMessage = "You logged into a secure area!";
		String actualSuccessMessage = secureareapage.getSuccessMessageText();
		Assert.assertTrue(actualSuccessMessage.contains(expectedSuccessMessage),
				"actualSuccessMessage does not contain expectedSuccessMessage\nexpectedSuccessMessage: "
						+ expectedSuccessMessage + "\nactualSuccessMessage: " + actualSuccessMessage);

	}
}
