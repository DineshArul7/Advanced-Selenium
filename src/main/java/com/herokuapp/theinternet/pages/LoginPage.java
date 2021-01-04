package com.herokuapp.theinternet.pages;

import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage extends BasePageObject{

	
	private By usernameLocator =By.id("username");
	private By passwordLocator =By.name("password");
	private By LogInButtomLocator =By.tagName("button");
	private By ErrorMessage=By.id("flash");
	
	
	public LoginPage(WebDriver driver,Logger log) {
		super(driver,log);
	}
	
public SecureAreaPage login(String username,String password) {
	log.info("Executing LogIn with Username ["+ username + "] and password [" + password + "]");
	type(username, usernameLocator);
	type(password, passwordLocator);
	click(LogInButtomLocator);
	return new SecureAreaPage(driver,log);
}

public void negativeLogIn(String username,String password) {
	log.info("Executing Negative LogIn with Username ["+ username + "] and password [" + password + "]");
	type(username, usernameLocator);
	type(password, passwordLocator);
	click(LogInButtomLocator);
}

public void waitForErrorMessage() {
	waitForVisibilityOf(ErrorMessage, 5);
}

public String getErrorMessage() {
	return find(ErrorMessage).getText();
}
	

}
