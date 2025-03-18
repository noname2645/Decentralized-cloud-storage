import React from 'react';
import "../Stylesheets/login.css";

const Login = () => {
    return (
        <form className="form">
            <p className="title">Register </p>
            <p className="message">Signup now and get full access to our app. </p>
                <div className="flex">
                <label>
                    <input className="input" type="text" placeholder="" required=""></input>
                    <span>Firstname</span>
                </label>
        
                <label>
                    <input className="input" type="text" placeholder="" required=""></input>
                    <span>Lastname</span>
                </label>
            </div>  
                    
            <label>
                <input className="input" type="email" placeholder="" required=""></input>
                <span>Email</span>
            </label> 
                
            <label>
                <input className="input" type="password" placeholder="" required=""></input>
                <span>Password</span>
            </label>
            <label>
                <input className="input" type="password" placeholder="" required=""></input>
                <span>Confirm password</span>
            </label>
            <button className="submit">Submit</button>
            <p className="signin">Already have an acount ? <a href="#">Signin</a> </p>
        </form>
    );
  };

  export default Login;  