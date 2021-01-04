package com.herokuapp.theinternet.pages;

import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class WelcomePage extends BasePageObject {
	
	private String url="http://the-internet.herokuapp.com/";
	private By FormAuthenticationLinkLocator=By.linkText("Form Authentication");
	private By checkboxlinklocator=By.linkText("Checkboxes");
	private By dropdownlinklocator=By.linkText("Dropdown");
	private By jsalertslinklocator=By.linkText("JavaScript Alerts");
	private By multipleWindowsLinkLocator = By.linkText("Multiple Windows");
	private By editorLinkLocator = By.linkText("WYSIWYG Editor");

	public WelcomePage(WebDriver driver,Logger log) {
		super(driver,log);
		
	}
	
	public void openPage() {
		log.info("Opening Page :"+" url");
		openUrl(url);
		log.info("Page Opened !!");
	}
	
	public LoginPage clickFormAuthenticationLinkLocator() {
		log.info("Clicking form authentication link on welcome page");
		click(FormAuthenticationLinkLocator);
		return new LoginPage(driver,log);
	}
	
	public CheckboxesPage ClickCheckboxesLink() {
		log.info("Clicking checkboxes link on welcome Page");
		click(checkboxlinklocator);
		return new CheckboxesPage(driver, log);
	}
	
	public DropdownPage clickDropdowLink() {
		log.info("Clicking dropdown link on welcome Page");
		click(dropdownlinklocator);
		return new DropdownPage(driver, log);
	}
	
	public AlertsPage clickjsAlertLink() {
		log.info("Clicking jsAlert link on welcome Page");
		click(jsalertslinklocator);
		return new AlertsPage(driver, log);
	}
	
	public WindowsPage clickMultipleWindowsLink() {
		log.info("Clicking Multiple Windows link on Welcome Page");
		click(multipleWindowsLinkLocator);
		return new WindowsPage(driver, log);
	}

	public EditorPage clickWYSIWYGEditorLink() {
		log.info("Clicking WYSIWYG Editor link on Welcome Page");
		click(editorLinkLocator);
		return new EditorPage(driver, log);
	}
	public void scrolltotheElement() {
		scrollToElement(find(editorLinkLocator));
	}
}
